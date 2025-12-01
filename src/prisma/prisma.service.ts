import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PRISMA SERVICE
 *
 * This service provides a singleton PrismaClient instance for the application.
 *
 * Purpose:
 * - Connects to the PostgreSQL database on module initialization.
 * - Disconnects from the database on module destruction.
 * - Can be injected into other services/controllers for database access.
 *
 * Notes:
 * - Extends PrismaClient.
 * - Implements OnModuleInit and OnModuleDestroy lifecycle hooks.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Called when the module is initialized; connects Prisma to the database
  async onModuleInit() {
    await this.$connect();
    console.log('Prisma connected successfully!');
  }
  // Called when the module is destroyed; disconnects Prisma from the database
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
