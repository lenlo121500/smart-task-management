import { config } from "./../config/app.config";
import { Resend } from "resend";
import Mustache from "mustache";
import fs from "fs/promises";
import path from "path";
import logger from "./logger.utils";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface WelcomeEmailData {
  firstName: string;
  username: string;
  workspaceName?: string;
  additionalFeatures?: string[];
}

interface ForgotPasswordEmailData {
  firstName: string;
  resetToken: string;
  resetUrl: string;
  expirationTime?: string;
}

interface ResetPasswordEmailData {
  firstName: string;
  showAdvancedTips?: boolean;
}

interface OTPEmailData {
  firstName: string;
  otp: string;
  expirationMinutes?: number;
  verificationUrl?: string;
}

interface BaseTemplateData {
  appName: string;
  appUrl: string;
  supportEmail: string;
  currentYear: number;
}

class EmailService {
  private resend: Resend;
  private defaultFrom: string;

  constructor() {
    const apiKey = config.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }

    this.resend = new Resend(apiKey);
    this.defaultFrom = config.RESEND_EMAIL_FROM || "noreply@yourapp.com";
  }

  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "emails",
        `${templateName}.html`
      );
      return await fs.readFile(templatePath, "utf-8");
    } catch (error) {
      logger.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    try {
      return Mustache.render(template, data);
    } catch (error) {
      logger.error("Failed to render email template", error);
      throw new Error("Failed to render email template");
    }
  }

  private getBaseTemplateData(): BaseTemplateData {
    return {
      appName: config.APP_NAME || "Smart Task",
      appUrl: config.APP_URL || "http://localhost:5173",
      supportEmail: config.SUPPORT_EMAIL || "support@smarttask.com",
      currentYear: new Date().getFullYear(),
    };
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const emailData = {
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        ...(options.text && { text: options.text }),
        ...(options.replyTo && { reply_to: options.replyTo }),
      };

      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        logger.error("Resend API error", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      logger.info(`Email sent successfully`, {
        emailId: data?.id,
        to: options.to,
        subject: options.subject,
      });
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}`, error);
      throw new Error("Failed to send email");
    }
  }

  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void> {
    try {
      const template = await this.loadTemplate("welcome");
      const templateData = {
        ...data,
        ...this.getBaseTemplateData(),
        // Set defaults if not provided
        workspaceName: data.workspaceName || undefined,
        additionalFeatures: data.additionalFeatures || [],
      };

      const html = this.renderTemplate(template, templateData);

      // Create dynamic text based on available data
      let textContent = `Welcome ${data.firstName}! Your account has been created successfully. Username: ${data.username}`;
      if (data.workspaceName) {
        textContent += `, Workspace: ${data.workspaceName}`;
      }

      await this.sendEmail({
        to,
        subject: `Welcome to ${templateData.appName}!`,
        html,
        text: textContent,
      });
    } catch (error) {
      logger.error("Failed to send welcome email", error);
      throw error;
    }
  }

  async sendForgotPasswordEmail(
    to: string,
    data: ForgotPasswordEmailData
  ): Promise<void> {
    try {
      const template = await this.loadTemplate("forgot-password");
      const templateData = {
        ...data,
        ...this.getBaseTemplateData(),
        // Set default expiration time if not provided
        expirationTime: data.expirationTime || "1 hour",
      };

      const html = this.renderTemplate(template, templateData);

      await this.sendEmail({
        to,
        subject: "Reset Your Password",
        html,
        text: `Hello ${data.firstName}, click the following link to reset your password: ${data.resetUrl}`,
      });
    } catch (error) {
      logger.error("Failed to send forgot password email", error);
      throw error;
    }
  }

  async sendPasswordResetConfirmationEmail(
    to: string,
    data: ResetPasswordEmailData
  ): Promise<void> {
    try {
      const template = await this.loadTemplate("password-reset-confirmation");
      const templateData = {
        ...data,
        ...this.getBaseTemplateData(),
        // Set default for advanced tips if not provided
        showAdvancedTips:
          data.showAdvancedTips !== undefined ? data.showAdvancedTips : true,
      };

      const html = this.renderTemplate(template, templateData);

      await this.sendEmail({
        to,
        subject: "Password Reset Successful",
        html,
        text: `Hello ${data.firstName}, your password has been reset successfully.`,
      });
    } catch (error) {
      logger.error("Failed to send password reset confirmation email", error);
      throw error;
    }
  }

  async sendOTPEmail(
    to: string,
    otp: string,
    firstName: string,
    options?: { expirationMinutes?: number; verificationUrl?: string }
  ): Promise<void> {
    try {
      const template = await this.loadTemplate("otp-verification");
      const data: OTPEmailData = {
        firstName,
        otp,
        expirationMinutes: options?.expirationMinutes || 10,
        verificationUrl: options?.verificationUrl,
      };
      const templateData = {
        ...data,
        ...this.getBaseTemplateData(),
      };

      const html = this.renderTemplate(template, templateData);

      await this.sendEmail({
        to,
        subject: "Verify Your Email Address",
        html,
        text: `Hello ${firstName}, your verification code is: ${otp}`,
      });
    } catch (error) {
      logger.error("Failed to send OTP email", error);
      throw error;
    }
  }

  // Additional utility method for sending custom emails
  async sendCustomEmail(
    to: string | string[],
    subject: string,
    templateName: string,
    data: Record<string, any>,
    options?: { from?: string; replyTo?: string; text?: string }
  ): Promise<void> {
    try {
      const template = await this.loadTemplate(templateName);
      const templateData = {
        ...data,
        ...this.getBaseTemplateData(),
      };

      const html = this.renderTemplate(template, templateData);

      await this.sendEmail({
        to,
        subject,
        html,
        from: options?.from,
        replyTo: options?.replyTo,
        text: options?.text,
      });
    } catch (error) {
      logger.error("Failed to send custom email", error);
      throw error;
    }
  }

  // Method to verify Resend API key and domain
  async verifyConfiguration(): Promise<boolean> {
    try {
      const response = await this.resend.domains.list();

      if (response.error) {
        logger.error(
          "Resend configuration verification failed",
          response.error
        );
        return false;
      }

      const domains = response.data;

      if (Array.isArray(domains)) {
        logger.info("Resend configuration verified successfully", {
          domainsCount: domains.length,
          domains: domains.map((d) => d.name),
        });
      } else {
        logger.warn("Unexpected format in Resend domains response", {
          domains,
        });
      }

      return true;
    } catch (error) {
      logger.error("Failed to verify Resend configuration", error);
      return false;
    }
  }
}

export default new EmailService();
