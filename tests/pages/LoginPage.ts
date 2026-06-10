import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput = () => this.page.locator('input[type="email"]');
  readonly passwordInput = () => this.page.locator('input[type="password"]');
  readonly submitButton = () => this.page.locator('button[type="submit"]');
  readonly welcomeHeading = () => this.page.locator('text=Welcome to Handl');
  readonly errorToast = () => this.page.locator('text=Invalid login credentials');
  readonly successToast = () => this.page.locator('text=Logged in successfully!');
  readonly registerLink = () => this.page.locator('text=Create one');
  readonly loginLink = () => this.page.locator('text=Sign In');
  readonly registrationSuccessToast = () => this.page.locator('text=Registration successful!');

  constructor(page: Page) {
    this.page = page;
  }

  goto = async (): Promise<void> => {
    await this.page.goto('/');
  };

  fillCredentials = async (email: string, password: string): Promise<void> => {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
  };

  submitForm = async (): Promise<void> => {
    await this.submitButton().click();
  };

  login = async (email: string, password: string): Promise<void> => {
    await this.goto();
    await this.fillCredentials(email, password);
    await this.submitForm();
  };

  register = async (email: string, password: string): Promise<void> => {
    await this.registerLink().click();
    await this.fillCredentials(email, password);
    await this.submitForm();
  };

  toggleToLogin = async (): Promise<void> => {
    await this.loginLink().click();
  };

  expectInvalidCredentials = async (): Promise<void> => {
    await expect(this.errorToast()).toBeVisible({ timeout: 5000 });
  };

  expectWelcomeScreen = async (): Promise<void> => {
    await expect(this.welcomeHeading()).toBeVisible();
  };

  expectLoginSuccess = async (): Promise<void> => {
    await expect(this.successToast()).toBeVisible({ timeout: 8000 });
  };

  expectRegistrationSuccess = async (): Promise<void> => {
    await expect(this.registrationSuccessToast()).toBeVisible({ timeout: 8500 });
  };
}
