import { Page, expect } from '@playwright/test';

export class ProfileDialogPage {
  readonly page: Page;
  readonly profileMenuButton = () => this.page.locator('header button').first();
  readonly editProfileMenuItem = () => this.page.locator('text=Edit Profile');
  readonly displayNameInput = () => this.page.locator('input[name="displayName"]');
  readonly saveChangesButton = () => this.page.locator('button[type="submit"]:has-text("Save Changes")');
  readonly deleteAccountButton = () => this.page.locator('button:has-text("Delete Account")');
  
  // Toasts
  readonly updateSuccessToast = () => this.page.locator('text=Profile updated successfully');

  constructor(page: Page) {
    this.page = page;
  }

  open = async (): Promise<void> => {
    await this.profileMenuButton().click();
    await this.editProfileMenuItem().click();
  };

  editDisplayName = async (name: string): Promise<void> => {
    await this.displayNameInput().fill(name);
    await this.saveChangesButton().click();
  };

  deleteAccount = async (confirmPhrase: string): Promise<void> => {
    // Register dialog handlers before trigger
    this.page.on('dialog', async dialog => {
      if (dialog.type() === 'confirm') {
        await dialog.accept();
      } else if (dialog.type() === 'prompt') {
        await dialog.accept(confirmPhrase);
      }
    });

    await this.deleteAccountButton().click();
  };

  expectUpdateSuccess = async (): Promise<void> => {
    await expect(this.updateSuccessToast()).toBeVisible();
  };
}
