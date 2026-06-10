import { Page, expect } from '@playwright/test';

export class TaskDialogPage {
  readonly page: Page;
  readonly dialog = () => this.page.locator('div[role="dialog"]');
  readonly titleInput = () => this.page.locator('input[name="title"]');
  readonly descriptionInput = () => this.page.locator('textarea[name="description"]');
  readonly handleNowSwitch = () => this.page.locator('button[role="switch"]');
  readonly submitButton = () => this.page.locator('button[type="submit"]:has-text("Create Handl")');
  readonly cancelButton = () => this.page.locator('button:has-text("Cancel")');
  
  // Validation Messages
  readonly titleRequiredError = () => this.page.locator('text=Title is required');
  readonly titleTooLongError = () => this.page.locator('text=Title must be under 150 characters');
  readonly descriptionTooLongError = () => this.page.locator('text=Description must be under 3000 characters');
  
  // Success Toast
  readonly creationSuccessToast = () => this.page.locator('text=Handl created successfully');
  readonly deletionSuccessToast = () => this.page.locator('text=Handl deleted successfully');

  constructor(page: Page) {
    this.page = page;
  }

  open = async (): Promise<void> => {
    await this.page.click('text=New Handl');
    await expect(this.dialog()).toBeVisible();
  };

  fillTitle = async (title: string): Promise<void> => {
    await this.titleInput().fill(title);
  };

  fillDescription = async (desc: string): Promise<void> => {
    await this.descriptionInput().fill(desc);
  };

  toggleHandleNow = async (state: boolean): Promise<void> => {
    const isChecked = await this.handleNowSwitch().getAttribute('aria-checked') === 'true';
    if (isChecked !== state) {
      await this.handleNowSwitch().click();
    }
  };

  submit = async (): Promise<void> => {
    await this.submitButton().click();
  };

  cancel = async (): Promise<void> => {
    await this.cancelButton().click();
    await expect(this.dialog()).not.toBeVisible();
  };

  createTask = async (title: string, desc?: string, handleNow?: boolean): Promise<void> => {
    await this.fillTitle(title);
    if (desc) await this.fillDescription(desc);
    if (handleNow !== undefined) await this.toggleHandleNow(handleNow);
    await this.submit();
  };

  deleteTask = async (taskTitle: string): Promise<void> => {
    const row = this.page.locator('tr').filter({ hasText: taskTitle });
    
    // Register confirmation dialog handler before trigger
    this.page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this handl?');
      await dialog.accept();
    });

    await row.locator('button:has(.lucide-trash-2)').click();
  };

  expectTitleRequiredError = async (): Promise<void> => {
    await expect(this.titleRequiredError()).toBeVisible();
  };

  expectTitleTooLongError = async (): Promise<void> => {
    await expect(this.titleTooLongError()).toBeVisible();
  };

  expectDescriptionTooLongError = async (): Promise<void> => {
    await expect(this.descriptionTooLongError()).toBeVisible();
  };

  expectCreationSuccess = async (): Promise<void> => {
    await expect(this.creationSuccessToast()).toBeVisible();
  };

  expectDeletionSuccess = async (): Promise<void> => {
    await expect(this.deletionSuccessToast()).toBeVisible();
  };
}
