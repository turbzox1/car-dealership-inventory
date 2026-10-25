#!/bin/sh
# Vercel build: generate the Prisma client, apply migrations and seed (production
# only, so preview builds never touch the live database), then build the frontend.
set -e
cd backend
npx prisma generate
if [ "$VERCEL_ENV" = "production" ]; then
  npx prisma migrate deploy
  npm run seed
fi
cd ../frontend
npm run build
