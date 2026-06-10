import { Page, expect, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly listViewTab = () => this.page.locator('aside button:has-text("Handl List")');
  readonly dashboardViewTab = () => this.page.locator('aside button:has-text("Dashboard")');
  readonly newHandlButton = () => this.page.locator('text=New Handl');
  readonly profileMenuButton = () => this.page.locator('header button').first();
  readonly editProfileMenuItem = () => this.page.locator('text=Edit Profile');
  readonly taskRows = () => this.page.locator('tr[data-index]');
  readonly reorderToast = () => this.page.locator('text=Handl reordered successfully!');

  constructor(page: Page) {
    this.page = page;
  }

  navigateToListView = async (): Promise<void> => {
    await this.listViewTab().click();
  };

  navigateToDashboardView = async (): Promise<void> => {
    await this.dashboardViewTab().click();
  };

  openProfileDialog = async (): Promise<void> => {
    await this.profileMenuButton().click();
    await this.editProfileMenuItem().click();
  };

  expectGreeting = async (): Promise<void> => {
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';

    await expect(this.page.locator(`text=${greeting}`)).toBeVisible({ timeout: 10000 });
  };

  getTaskRow = (taskTitle: string): Locator => {
    return this.page.locator('tr').filter({ hasText: taskTitle });
  };

  expectTaskAlertDot = async (taskTitle: string, dotClass: string): Promise<void> => {
    const row = this.getTaskRow(taskTitle);
    await expect(row.locator(dotClass)).toBeVisible();
  };

  expectNoTaskAlertDot = async (taskTitle: string): Promise<void> => {
    const row = this.getTaskRow(taskTitle);
    await expect(row.locator('span[class*="animate-soft-glow"]')).not.toBeVisible();
  };

  expectTaskBadge = async (taskTitle: string, badgeText: string): Promise<void> => {
    const row = this.getTaskRow(taskTitle);
    await expect(row.getByText(badgeText, { exact: true })).toBeVisible();
  };

  expectTaskDateStyle = async (taskTitle: string, styleClass: string): Promise<void> => {
    const row = this.getTaskRow(taskTitle);
    await expect(row.locator(`div${styleClass}`)).toBeVisible();
  };

  expectTaskDateText = async (taskTitle: string, dateText: string): Promise<void> => {
    const row = this.getTaskRow(taskTitle);
    await expect(row.getByText(dateText, { exact: true })).toBeVisible();
  };

  expectTaskCompletedState = async (taskTitle: string): Promise<void> => {
    const row = this.getTaskRow(taskTitle);
    await expect(row.getByText('Done', { exact: true })).toBeVisible();
    await expect(row.locator('.text-green-500')).toBeVisible();
  };

  expectTaskCount = async (count: number): Promise<void> => {
    await expect(this.taskRows()).toHaveCount(count);
  };

  dragAndDropTask = async (sourceIndex: number, targetIndex: number): Promise<void> => {
    const sourceRow = this.taskRows().nth(sourceIndex);
    const targetRow = this.taskRows().nth(targetIndex);

    const dragHandle = sourceRow.locator('td').nth(0);
    const dropTarget = targetRow.locator('td').nth(0);

    await dragHandle.dragTo(dropTarget);
  };

  expectReorderSuccess = async (): Promise<void> => {
    await expect(this.reorderToast()).toBeVisible();
  };

  getTaskTitleAt = async (index: number): Promise<string | null> => {
    const row = this.taskRows().nth(index);
    return await row.locator('td').nth(2).locator('span').first().textContent();
  };
}
