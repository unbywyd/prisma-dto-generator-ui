/**
 * WTP API Starter
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface ConfigSchema { 
    NAME: string;
    PORT: number;
    VERSION: string;
    HOST: string;
    CORS_ORIGIN: string;
    API_PREFIX: string;
    IS_PRODUCTION: boolean;
    IO_SOCKET: boolean;
    DATABASE_URL: string;
    S3_BUCKET_PUBLIC: string;
    S3_BUCKET_PRIVATE: string;
    S3_REGION: string;
    S3_KEYID: string;
    S3_SECRET: string;
    JWT_SECRET: string;
    JWT_DAYS: number;
    CRON_ENABLED: boolean;
    IO_ENABLED: boolean;
    MASTER_SECRET_KEY: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_FROM: string;
    SMTP_EMAIL: string;
    SMTP_PASS: string;
    CLIENT_URL: string;
    SENDGRID_API_KEY: string;
    SENDGRID_FROM_EMAIL: string;
    INFORU_SENDER_NAME: string;
    INFORU_KEY: string;
    INFORU_TOKEN_FUTURE: string;
    INFORU_PASSWORD: string;
    INFORU_USER_NAME: string;
}

