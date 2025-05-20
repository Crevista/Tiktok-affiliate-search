import { PrismaClient } from '@prisma/client';

// Global to maintain connection across hot reloads
const globalForPrisma = global;

// Create a new client if not already created
export const prisma = globalForPrisma.prisma || new PrismaClient();

// Keep connection in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

4. **In your schema.prisma, let's make sure the provider line matches exactly**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
