# Test Report

Generated 2026-10-25 from `npm run test:coverage` in `backend/` and `frontend/`.
Backend tests run against a real PostgreSQL test database (unit tests use in-memory fakes);
frontend tests render the app with Testing Library and mock the API with MSW.

| Suite | Tests | Statements | Branches | Functions | Lines |
|---|---|---|---|---|---|
| Backend (Jest) | 232/232 | 98.61% | 93.41% | 100% | 98.91% |
| Frontend (Vitest) | 87/87 | 95.87% | 90.81% | 95.67% | 97.2% |

## Backend

**232 / 232 tests passed** in 20 files.

| Coverage | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| **Total** | 98.61% | 93.41% | 100% | 98.91% |
| src/app.ts | 100% | 100% | 100% | 100% |
| src/config.ts | 97.61% | 97.29% | 100% | 100% |
| src/controllers/AuthController.ts | 100% | 100% | 100% | 100% |
| src/controllers/InventoryController.ts | 100% | 100% | 100% | 100% |
| src/controllers/VehicleController.ts | 100% | 100% | 100% | 100% |
| src/db/prisma.ts | 100% | 100% | 100% | 100% |
| src/db/sampleVehicles.ts | 100% | 100% | 100% | 100% |
| src/db/seed.ts | 100% | 92.85% | 100% | 100% |
| src/domain/errors.ts | 100% | 25% | 100% | 100% |
| src/domain/Vehicle.ts | 100% | 100% | 100% | 100% |
| src/lifecycle.ts | 100% | 66.66% | 100% | 100% |
| src/middleware/authenticate.ts | 90% | 90% | 100% | 94.44% |
| src/middleware/errorHandler.ts | 84.61% | 87.5% | 100% | 84.61% |
| src/middleware/rateLimit.ts | 100% | 100% | 100% | 100% |
| src/middleware/requireAdmin.ts | 100% | 100% | 100% | 100% |
| src/middleware/validate.ts | 100% | 100% | 100% | 100% |
| src/repositories/PrismaInventoryRepository.ts | 98.18% | 90% | 100% | 97.82% |
| src/repositories/PrismaUserRepository.ts | 100% | 100% | 100% | 100% |
| src/repositories/PrismaVehicleRepository.ts | 95.23% | 90% | 100% | 95% |
| src/routes/authRoutes.ts | 100% | 100% | 100% | 100% |
| src/routes/inventoryRoutes.ts | 100% | 100% | 100% | 100% |
| src/routes/vehicleRoutes.ts | 100% | 100% | 100% | 100% |
| src/services/AuthService.ts | 100% | 100% | 100% | 100% |
| src/services/InventoryService.ts | 100% | 100% | 100% | 100% |
| src/services/VehicleService.ts | 100% | 100% | 100% | 100% |
| src/validation/authSchemas.ts | 100% | 100% | 100% | 100% |
| src/validation/inventorySchemas.ts | 100% | 100% | 100% | 100% |
| src/validation/vehicleSchemas.ts | 100% | 100% | 100% | 100% |

<details><summary><code>tests/integration/app.test.ts</code> — 7/7 passed</summary>

- ✅ App-wide behaviour › GET /api/health returns 200 without authentication
- ✅ App-wide behaviour › returns a JSON 404 for unknown routes
- ✅ App-wide behaviour › returns 400 (not 500) for a malformed JSON body
- ✅ App-wide behaviour › returns 413 (not 500) for a body over the size limit
- ✅ App-wide behaviour › sends security headers on API responses
- ✅ App-wide behaviour › CORS › allows the configured frontend origin, including preflight for Authorization
- ✅ App-wide behaviour › CORS › does not allow other origins

</details>

<details><summary><code>tests/integration/auth.routes.test.ts</code> — 16/16 passed</summary>

- ✅ Auth routes (Postgres) › POST /api/auth/register › creates a user, returns 201 without the password and stores it in the database
- ✅ Auth routes (Postgres) › POST /api/auth/register › returns 409 for an email that is already registered
- ✅ Auth routes (Postgres) › POST /api/auth/register › creates exactly one account when the same email registers concurrently
- ✅ Auth routes (Postgres) › POST /api/auth/register › treats emails case-insensitively
- ✅ Auth routes (Postgres) › POST /api/auth/register › returns 400 for missing name
- ✅ Auth routes (Postgres) › POST /api/auth/register › returns 400 for invalid email
- ✅ Auth routes (Postgres) › POST /api/auth/register › returns 400 for short password
- ✅ Auth routes (Postgres) › POST /api/auth/register › returns 400 for empty body
- ✅ Auth routes (Postgres) › POST /api/auth/login › returns 200 with a valid JWT and the user
- ✅ Auth routes (Postgres) › POST /api/auth/login › accepts the email in any letter case
- ✅ Auth routes (Postgres) › POST /api/auth/login › returns 401 for a wrong password
- ✅ Auth routes (Postgres) › POST /api/auth/login › returns 401 for an unknown email
- ✅ Auth routes (Postgres) › POST /api/auth/login › returns 400 when fields are missing
- ✅ Auth routes (Postgres) › GET /api/auth/me › returns the signed-in user without credentials
- ✅ Auth routes (Postgres) › GET /api/auth/me › reflects a role change made after the token was issued
- ✅ Auth routes (Postgres) › GET /api/auth/me › returns 401 without a token or for a deleted account

</details>

<details><summary><code>tests/integration/checkoutConcurrency.test.ts</code> — 2/2 passed</summary>

- ✅ Checkout concurrency (Postgres) › sells the last unit to exactly one of several carts that contain it
- ✅ Checkout concurrency (Postgres) › does not deadlock when carts lock the same vehicles in opposite orders

</details>

<details><summary><code>tests/integration/inventory.routes.test.ts</code> — 28/28 passed</summary>

- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › returns 401 without a token
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › buys one unit by default and returns the purchase and updated vehicle
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › buys several units when a quantity is given
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › returns 409 when stock is insufficient and changes nothing
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › returns 409 when out of stock
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › returns 404 for an unknown vehicle
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › returns 400 for quantity 0
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › returns 400 for quantity -1
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › returns 400 for quantity 1.5
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/purchase › returns 400 for quantity "two"
- ✅ Inventory routes (Postgres) › concurrent purchases over HTTP (end-to-end status codes) › sells the last unit exactly once when 5 buyers race for it
- ✅ Inventory routes (Postgres) › concurrent purchases over HTTP (end-to-end status codes) › sells exactly 3 units when 10 buyers race for 3 in stock
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/restock › returns 401 without a token and 403 for a regular user
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/restock › increases stock for an admin
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/restock › returns 404 for an unknown vehicle
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/restock › returns 400 for body {}
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/restock › returns 400 for body {"amount": 0}
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/restock › returns 400 for body {"amount": -2}
- ✅ Inventory routes (Postgres) › POST /api/vehicles/:id/restock › returns 400 for body {"amount": 2.5}
- ✅ Inventory routes (Postgres) › purchase history › GET /api/purchases/me returns only the caller's purchases
- ✅ Inventory routes (Postgres) › purchase history › GET /api/purchases returns every purchase with the customer for an admin
- ✅ Inventory routes (Postgres) › purchase history › GET /api/purchases returns 403 for a regular user and 401 without a token
- ✅ Inventory routes (Postgres) › deleting (archiving) a vehicle › keeps purchase history with the vehicle details
- ✅ Inventory routes (Postgres) › deleting (archiving) a vehicle › hides the vehicle from listing and search
- ✅ Inventory routes (Postgres) › deleting (archiving) a vehicle › treats the archived vehicle as not found for every other operation
- ✅ Inventory routes (Postgres) › tokens of changed accounts › returns 401 (not 500) when a deleted user tries to purchase with an old token
- ✅ Inventory routes (Postgres) › tokens of changed accounts › returns 403 when an admin demoted after login tries to restock
- ✅ Inventory routes (Postgres) › database constraints › rejects negative stock even if application code tried to write it

</details>

<details><summary><code>tests/integration/orders.routes.test.ts</code> — 12/12 passed</summary>

- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › buys every line as one order and decreases each stock
- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › is all or nothing: one short line means nothing is bought (409 naming the vehicle)
- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › returns 404 and buys nothing if any vehicle is unknown or archived
- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › merges repeated lines for the same vehicle
- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › returns 400 for no items field
- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › returns 400 for an empty cart
- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › returns 400 for a missing vehicle id
- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › returns 400 for a zero quantity
- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › returns 400 for a fractional quantity
- ✅ Orders (cart checkout) routes (Postgres) › POST /api/orders › returns 401 without a token
- ✅ Orders (cart checkout) routes (Postgres) › order history › GET /api/orders/me lists the caller's orders, newest first, including single Purchase clicks
- ✅ Orders (cart checkout) routes (Postgres) › order history › GET /api/orders lists every order with the customer for admins only

</details>

<details><summary><code>tests/integration/PrismaInventoryRepository.test.ts</code> — 5/5 passed</summary>

- ✅ PrismaInventoryRepository concurrency (Postgres) › with 1 in stock and 5 simultaneous single-unit buyers, sells exactly the stock
- ✅ PrismaInventoryRepository concurrency (Postgres) › with 3 in stock and 10 simultaneous single-unit buyers, sells exactly the stock
- ✅ PrismaInventoryRepository concurrency (Postgres) › with 5 in stock and 30 simultaneous single-unit buyers, sells exactly the stock
- ✅ PrismaInventoryRepository concurrency (Postgres) › never sells more units than exist when buyers request different quantities at once
- ✅ PrismaInventoryRepository concurrency (Postgres) › loses no updates when restocks and purchases run at the same time

</details>

<details><summary><code>tests/integration/PrismaUserRepository.test.ts</code> — 2/2 passed</summary>

- ✅ PrismaUserRepository › maps a unique-email violation to ConflictError
- ✅ PrismaUserRepository › rethrows other database errors unchanged

</details>

<details><summary><code>tests/integration/rateLimit.test.ts</code> — 7/7 passed</summary>

- ✅ Auth rate limiting (Postgres) › blocks login with a JSON 429 after too many failed attempts
- ✅ Auth rate limiting (Postgres) › also blocks the correct password once the limit is reached
- ✅ Auth rate limiting (Postgres) › does not count successful logins towards the limit
- ✅ Auth rate limiting (Postgres) › limits registrations per client
- ✅ Auth rate limiting (Postgres) › does not rate-limit other routes
- ✅ Auth rate limiting (Postgres) › client IP behind a proxy › with trustProxy, counts each X-Forwarded-For client separately
- ✅ Auth rate limiting (Postgres) › client IP behind a proxy › without trustProxy, ignores X-Forwarded-For so the limit cannot be dodged by spoofing it

</details>

<details><summary><code>tests/integration/seed.test.ts</code> — 14/14 passed</summary>

- ✅ seedDatabase › creates an admin with a hashed password and a normalized email
- ✅ seedDatabase › adds sample vehicles to an empty catalogue
- ✅ seedDatabase › is safe to run twice: one admin, no duplicate vehicles
- ✅ seedDatabase › offers a full showroom: at least 30 vehicles covering every category
- ✅ seedDatabase › adds only the missing sample vehicles and leaves existing ones untouched
- ✅ seedDatabase › gives every sample vehicle basic details, a description and credited photos
- ✅ seedDatabase › fills in details and photos for existing sample vehicles that have none, without overwriting edits
- ✅ seedDatabase › does not bring back a sample vehicle an admin archived
- ✅ seedDatabase › promotes an existing user with the admin email without changing their password
- ✅ seedDatabase › refuses to run with missing email
- ✅ seedDatabase › refuses to run with invalid email
- ✅ seedDatabase › refuses to run with short password
- ✅ seedDatabase › refuses to run with placeholder password
- ✅ seedDatabase › refuses to run with password under 12 characters

</details>

<details><summary><code>tests/integration/vehicle.routes.test.ts</code> — 34/34 passed</summary>

- ✅ Vehicle routes (Postgres) › authentication and roles › GET /api/vehicles returns 401 without a token
- ✅ Vehicle routes (Postgres) › authentication and roles › GET /api/vehicles/search returns 401 without a token
- ✅ Vehicle routes (Postgres) › authentication and roles › POST /api/vehicles returns 401 without a token
- ✅ Vehicle routes (Postgres) › authentication and roles › PUT /api/vehicles/some-id returns 401 without a token
- ✅ Vehicle routes (Postgres) › authentication and roles › DELETE /api/vehicles/some-id returns 401 without a token
- ✅ Vehicle routes (Postgres) › authentication and roles › POST /api/vehicles returns 403 for a regular user
- ✅ Vehicle routes (Postgres) › authentication and roles › PUT /api/vehicles/some-id returns 403 for a regular user
- ✅ Vehicle routes (Postgres) › authentication and roles › DELETE /api/vehicles/some-id returns 403 for a regular user
- ✅ Vehicle routes (Postgres) › POST /api/vehicles › creates a vehicle and returns 201 with numeric price
- ✅ Vehicle routes (Postgres) › POST /api/vehicles › accepts a lower-case category
- ✅ Vehicle routes (Postgres) › POST /api/vehicles › returns 400 for missing make
- ✅ Vehicle routes (Postgres) › POST /api/vehicles › returns 400 for empty model
- ✅ Vehicle routes (Postgres) › POST /api/vehicles › returns 400 for unknown category
- ✅ Vehicle routes (Postgres) › POST /api/vehicles › returns 400 for negative price
- ✅ Vehicle routes (Postgres) › POST /api/vehicles › returns 400 for zero price
- ✅ Vehicle routes (Postgres) › POST /api/vehicles › returns 400 for fractional quantity
- ✅ Vehicle routes (Postgres) › POST /api/vehicles › returns 400 for negative quantity
- ✅ Vehicle routes (Postgres) › GET /api/vehicles › lets a regular user list all vehicles, including out-of-stock ones
- ✅ Vehicle routes (Postgres) › GET /api/vehicles/search › matches make partially and case-insensitively
- ✅ Vehicle routes (Postgres) › GET /api/vehicles/search › matches model partially and case-insensitively
- ✅ Vehicle routes (Postgres) › GET /api/vehicles/search › filters by category (any case)
- ✅ Vehicle routes (Postgres) › GET /api/vehicles/search › filters by an inclusive price range
- ✅ Vehicle routes (Postgres) › GET /api/vehicles/search › combines filters
- ✅ Vehicle routes (Postgres) › GET /api/vehicles/search › returns everything when no filters are given
- ✅ Vehicle routes (Postgres) › GET /api/vehicles/search › returns 400 for non-numeric price
- ✅ Vehicle routes (Postgres) › GET /api/vehicles/search › returns 400 for unknown category
- ✅ Vehicle routes (Postgres) › GET /api/vehicles/search › returns 400 for min above max
- ✅ Vehicle routes (Postgres) › PUT /api/vehicles/:id › updates details and returns the vehicle
- ✅ Vehicle routes (Postgres) › PUT /api/vehicles/:id › returns 404 for an unknown id
- ✅ Vehicle routes (Postgres) › PUT /api/vehicles/:id › returns 400 for empty body
- ✅ Vehicle routes (Postgres) › PUT /api/vehicles/:id › returns 400 for quantity (use purchase/restock instead)
- ✅ Vehicle routes (Postgres) › PUT /api/vehicles/:id › returns 400 for invalid price
- ✅ Vehicle routes (Postgres) › DELETE /api/vehicles/:id › archives the vehicle (soft delete) and returns 204
- ✅ Vehicle routes (Postgres) › DELETE /api/vehicles/:id › returns 404 for an unknown id

</details>

<details><summary><code>tests/integration/vehicleDetails.routes.test.ts</code> — 12/12 passed</summary>

- ✅ Vehicle details (Postgres) › GET /api/vehicles/:id › returns the vehicle with its details and photos
- ✅ Vehicle details (Postgres) › GET /api/vehicles/:id › returns empty details for a vehicle created without them
- ✅ Vehicle details (Postgres) › GET /api/vehicles/:id › returns 404 for an unknown or archived vehicle, 401 without a token
- ✅ Vehicle details (Postgres) › GET /api/vehicles/:id › includes photos in the list too, so cards can show them
- ✅ Vehicle details (Postgres) › admins can set the basic details › on create
- ✅ Vehicle details (Postgres) › admins can set the basic details › on update, leaving other fields untouched
- ✅ Vehicle details (Postgres) › admins can set the basic details › rejects an unknown fuel type with 400
- ✅ Vehicle details (Postgres) › admins can set the basic details › rejects an unknown transmission with 400
- ✅ Vehicle details (Postgres) › admins can set the basic details › rejects a year far in the future with 400
- ✅ Vehicle details (Postgres) › admins can set the basic details › rejects zero seats with 400
- ✅ Vehicle details (Postgres) › admins can set the basic details › rejects a very long description with 400
- ✅ Vehicle details (Postgres) › admins can set the basic details › does not let the API set photos (they come from the curated seed)

</details>

<details><summary><code>tests/unit/authMiddleware.test.ts</code> — 15/15 passed</summary>

- ✅ authenticate middleware (401 on missing/invalid token) › returns 401 when the Authorization header is missing
- ✅ authenticate middleware (401 on missing/invalid token) › returns 401 when the scheme is not Bearer
- ✅ authenticate middleware (401 on missing/invalid token) › returns 401 for a malformed token
- ✅ authenticate middleware (401 on missing/invalid token) › returns 401 for a token signed with a different secret
- ✅ authenticate middleware (401 on missing/invalid token) › returns 401 for a correctly signed token that uses an algorithm other than HS256
- ✅ authenticate middleware (401 on missing/invalid token) › returns 401 for an unsigned (alg: none) token
- ✅ authenticate middleware (401 on missing/invalid token) › returns 401 for an expired token
- ✅ authenticate middleware (401 on missing/invalid token) › attaches the user id and role for a valid token
- ✅ authenticate uses the current database state, not the token claims › returns 401 when the user behind a valid token has been deleted
- ✅ authenticate uses the current database state, not the token claims › returns 403 on admin routes for an admin demoted after login
- ✅ authenticate uses the current database state, not the token claims › ignores a role claim that does not match the database
- ✅ requireAdmin middleware (403 for logged-in non-admins) › returns 401 (not 403) when no token is sent to an admin route
- ✅ requireAdmin middleware (403 for logged-in non-admins) › returns 403 when a logged-in regular user calls an admin route
- ✅ requireAdmin middleware (403 for logged-in non-admins) › lets an admin through
- ✅ requireAdmin middleware (403 for logged-in non-admins) › returns 401 if used without authenticate in front of it

</details>

<details><summary><code>tests/unit/AuthService.login.test.ts</code> — 5/5 passed</summary>

- ✅ AuthService.login › returns a signed JWT carrying the user id and role
- ✅ AuthService.login › rejects an unknown email
- ✅ AuthService.login › signs tokens with HS256
- ✅ AuthService.login › still runs a bcrypt comparison for an unknown email, so timing does not reveal which emails exist
- ✅ AuthService.login › rejects a wrong password

</details>

<details><summary><code>tests/unit/AuthService.profile.test.ts</code> — 2/2 passed</summary>

- ✅ AuthService.getProfile › returns the current account without credentials
- ✅ AuthService.getProfile › throws NotFoundError for an unknown id

</details>

<details><summary><code>tests/unit/AuthService.register.test.ts</code> — 3/3 passed</summary>

- ✅ AuthService.register › creates a regular user and never returns the password
- ✅ AuthService.register › stores a hashed password, not the plain text
- ✅ AuthService.register › rejects a duplicate email

</details>

<details><summary><code>tests/unit/config.test.ts</code> — 30/30 passed</summary>

- ✅ isPlaceholderSecret › flags "change-me"
- ✅ isPlaceholderSecret › flags "CHANGE_ME"
- ✅ isPlaceholderSecret › flags "changeme"
- ✅ isPlaceholderSecret › flags "change-me-too"
- ✅ isPlaceholderSecret › flags "please-change-me-now"
- ✅ isPlaceholderSecret › flags "secret"
- ✅ isPlaceholderSecret › flags "password"
- ✅ isPlaceholderSecret › flags "your-secret"
- ✅ isPlaceholderSecret › accepts "k3J9xQ2mZ8vT4wR7yB1nL6pH0sD5fG2a"
- ✅ isPlaceholderSecret › accepts "Correct-Horse-Battery-Staple-42"
- ✅ loadServerConfig › returns typed config with defaults for optional values
- ✅ loadServerConfig › does not trust proxy headers unless TRUST_PROXY is set
- ✅ loadServerConfig › listens on localhost only outside production
- ✅ loadServerConfig › listens on all interfaces in production, so a hosting platform can route to it
- ✅ loadServerConfig › lets HOST override the default
- ✅ loadServerConfig › throws for a TRUST_PROXY that is not a hop count
- ✅ loadServerConfig › parses PORT and a comma-separated CORS_ORIGINS list
- ✅ loadServerConfig › throws for missing JWT_SECRET
- ✅ loadServerConfig › throws for empty JWT_SECRET
- ✅ loadServerConfig › throws for short JWT_SECRET
- ✅ loadServerConfig › throws for placeholder JWT_SECRET
- ✅ loadServerConfig › throws for long placeholder JWT_SECRET
- ✅ loadServerConfig › throws for missing DATABASE_URL
- ✅ loadServerConfig › throws for non-numeric PORT
- ✅ loadServerConfig › reports every problem at once
- ✅ loadSeedConfig › returns the admin credentials
- ✅ loadSeedConfig › throws for missing ADMIN_PASSWORD
- ✅ loadSeedConfig › throws for short ADMIN_PASSWORD
- ✅ loadSeedConfig › throws for placeholder ADMIN_PASSWORD
- ✅ loadSeedConfig › throws for missing ADMIN_EMAIL

</details>

<details><summary><code>tests/unit/gracefulShutdown.test.ts</code> — 4/4 passed</summary>

- ✅ createGracefulShutdown › lets an in-flight request finish, then disconnects the database
- ✅ createGracefulShutdown › stops accepting new connections
- ✅ createGracefulShutdown › gives up waiting after the timeout so a stuck request cannot block shutdown
- ✅ createGracefulShutdown › runs only once even if several signals arrive

</details>

<details><summary><code>tests/unit/InventoryService.checkout.test.ts</code> — 11/11 passed</summary>

- ✅ InventoryService.checkout › buys every line as one order with a total
- ✅ InventoryService.checkout › merges repeated lines for the same vehicle
- ✅ InventoryService.checkout › buys nothing and names the vehicle when one line is short
- ✅ InventoryService.checkout › says when a vehicle is sold out
- ✅ InventoryService.checkout › throws NotFoundError for an unknown vehicle
- ✅ InventoryService.checkout › rejects an empty cart with ValidationError
- ✅ InventoryService.checkout › rejects a zero quantity with ValidationError
- ✅ InventoryService.checkout › rejects a fractional quantity with ValidationError
- ✅ InventoryService.checkout › rejects more than 20 different vehicles with ValidationError
- ✅ InventoryService.checkout › records a single Purchase as a one-line order
- ✅ InventoryService.checkout › lists only the caller's orders, and every order for admins

</details>

<details><summary><code>tests/unit/InventoryService.test.ts</code> — 15/15 passed</summary>

- ✅ InventoryService › purchase › buys one unit by default, decreasing stock and recording the purchase
- ✅ InventoryService › purchase › buys several units at once
- ✅ InventoryService › purchase › throws ConflictError when stock is insufficient, leaving stock unchanged
- ✅ InventoryService › purchase › throws ConflictError when the vehicle is out of stock
- ✅ InventoryService › purchase › throws NotFoundError for an unknown vehicle
- ✅ InventoryService › purchase › rejects quantity 0 with ValidationError
- ✅ InventoryService › purchase › rejects quantity -1 with ValidationError
- ✅ InventoryService › purchase › rejects quantity 1.5 with ValidationError
- ✅ InventoryService › restock › increases stock by the given amount
- ✅ InventoryService › restock › throws NotFoundError for an unknown vehicle
- ✅ InventoryService › restock › rejects amount 0 with ValidationError
- ✅ InventoryService › restock › rejects amount -3 with ValidationError
- ✅ InventoryService › restock › rejects amount 2.5 with ValidationError
- ✅ InventoryService › purchase history › returns only the caller's own purchases
- ✅ InventoryService › purchase history › returns every purchase for the admin listing

</details>

<details><summary><code>tests/unit/VehicleService.test.ts</code> — 8/8 passed</summary>

- ✅ VehicleService › creates a vehicle with an id
- ✅ VehicleService › lists all vehicles, including out-of-stock ones
- ✅ VehicleService › search › passes the criteria to the repository
- ✅ VehicleService › search › rejects a price range where minPrice is above maxPrice
- ✅ VehicleService › update › updates the given details
- ✅ VehicleService › update › throws NotFoundError for an unknown id
- ✅ VehicleService › delete › removes the vehicle
- ✅ VehicleService › delete › throws NotFoundError for an unknown id

</details>

## Frontend

**87 / 87 tests passed** in 35 files.

| Coverage | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| **Total** | 95.87% | 90.81% | 95.67% | 97.2% |
| src/api/adminVehicles.ts | 100% | 100% | 100% | 100% |
| src/api/auth.ts | 100% | 100% | 100% | 100% |
| src/api/client.ts | 100% | 100% | 100% | 100% |
| src/api/orders.ts | 100% | 100% | 100% | 100% |
| src/api/useApi.ts | 100% | 100% | 100% | 100% |
| src/api/vehicles.ts | 100% | 100% | 100% | 100% |
| src/App.tsx | 50% | 100% | 50% | 50% |
| src/auth/AuthProvider.tsx | 95.55% | 88% | 100% | 100% |
| src/auth/routeGuards.tsx | 100% | 90% | 100% | 100% |
| src/auth/useAuth.ts | 80% | 50% | 100% | 100% |
| src/cart/CartProvider.tsx | 95.45% | 87.5% | 100% | 96.96% |
| src/cart/useCart.ts | 80% | 50% | 100% | 100% |
| src/components/admin/DeleteVehicleDialog.tsx | 100% | 75% | 100% | 100% |
| src/components/admin/RestockDialog.tsx | 89.47% | 66.66% | 100% | 89.47% |
| src/components/admin/VehicleFormDialog.tsx | 97.43% | 94.73% | 100% | 100% |
| src/components/AppHeader.tsx | 100% | 100% | 100% | 100% |
| src/components/AuthLayout.tsx | 100% | 100% | 100% | 100% |
| src/components/Dialog.tsx | 100% | 92.85% | 100% | 100% |
| src/components/form.tsx | 100% | 100% | 100% | 100% |
| src/components/heroPhoto.ts | 100% | 100% | 100% | 100% |
| src/components/Logo.tsx | 100% | 100% | 100% | 100% |
| src/components/OrderCard.tsx | 100% | 100% | 100% | 100% |
| src/components/PageStates.tsx | 100% | 100% | 100% | 100% |
| src/components/SiteFooter.tsx | 100% | 100% | 100% | 100% |
| src/components/SketchCar.tsx | 100% | 100% | 100% | 100% |
| src/components/styles.ts | 100% | 100% | 100% | 100% |
| src/components/Toast.tsx | 100% | 100% | 100% | 100% |
| src/components/VehicleCard.tsx | 100% | 100% | 100% | 100% |
| src/components/VehicleFiltersBar.tsx | 100% | 100% | 100% | 100% |
| src/components/VehiclePhoto.tsx | 100% | 76.92% | 100% | 100% |
| src/format.ts | 100% | 100% | 100% | 100% |
| src/hooks/useApiResource.ts | 100% | 83.33% | 100% | 100% |
| src/hooks/useDebouncedValue.ts | 100% | 100% | 100% | 100% |
| src/index.css | 100% | 100% | 100% | 100% |
| src/pages/AllOrdersPage.tsx | 100% | 85% | 100% | 100% |
| src/pages/CartPage.tsx | 95.83% | 85.71% | 87.5% | 95.83% |
| src/pages/DashboardPage.tsx | 94.28% | 90.9% | 89.36% | 97.67% |
| src/pages/LoginPage.tsx | 100% | 90% | 100% | 100% |
| src/pages/MyOrdersPage.tsx | 100% | 100% | 100% | 100% |
| src/pages/RegisterPage.tsx | 100% | 92.85% | 100% | 100% |
| src/pages/VehicleDetailPage.tsx | 76.92% | 79.16% | 76.92% | 77.14% |
| src/types.ts | 100% | 100% | 100% | 100% |

<details><summary><code>src/api/client.test.ts</code> — 6/6 passed</summary>

- ✅ apiRequest › returns the parsed JSON body
- ✅ apiRequest › sends a JSON body and the Bearer token when given
- ✅ apiRequest › throws ApiError with the server's status and message
- ✅ apiRequest › handles 204 No Content
- ✅ apiRequest › turns a network failure into a friendly ApiError with status 0
- ✅ apiRequest › falls back to a generic message when an error response has no JSON body

</details>

<details><summary><code>src/auth/session.test.tsx</code> — 6/6 passed</summary>

- ✅ Session handling › sends signed-out visitors of a protected page to the login page
- ✅ Session handling › returns the user to the page they wanted after signing in
- ✅ Session handling › restores a saved session after a page reload
- ✅ Session handling › ignores a corrupted saved session
- ✅ Session handling › redirects a signed-in user away from the login page
- ✅ Session handling › signs out: clears the session and returns to the login page

</details>

<details><summary><code>src/auth/sessionRefresh.test.tsx</code> — 5/5 passed</summary>

- ✅ Refreshing the stored user on load › hides admin features when the account was demoted since sign-in
- ✅ Refreshing the stored user on load › shows admin features when the account was promoted since sign-in
- ✅ Refreshing the stored user on load › signs out when the session is no longer valid
- ✅ Refreshing the stored user on load › keeps the saved session if the check fails for another reason (e.g. offline)
- ✅ Refreshing the stored user on load › does not call the API when nobody is signed in

</details>

<details><summary><code>src/format.test.ts</code> — 7/7 passed</summary>

- ✅ formatPrice › formats %p as %p
- ✅ formatPrice › formats %p as %p
- ✅ formatPrice › formats %p as %p
- ✅ formatPrice › formats %p as %p
- ✅ stockLabel › describes %p units as %p
- ✅ stockLabel › describes %p units as %p
- ✅ stockLabel › describes %p units as %p

</details>

<details><summary><code>src/pages/AdminDashboard.test.tsx</code> — 12/12 passed</summary>

- ✅ Admin controls visibility › are hidden from regular users
- ✅ Admin controls visibility › are shown to admins on every card
- ✅ Adding a vehicle › creates the vehicle with typed values and shows it in the grid
- ✅ Adding a vehicle › checks the form before sending anything
- ✅ Adding a vehicle › shows a server error inside the dialog and keeps it open
- ✅ Adding a vehicle › closes with Cancel or Escape without saving
- ✅ Editing a vehicle › opens pre-filled, sends the details without quantity, and updates the card
- ✅ Restocking › adds units and updates the stock shown, even for a sold-out vehicle
- ✅ Restocking › rejects a non-positive or fractional amount
- ✅ Deleting › asks for confirmation, explains history is kept, then removes the card
- ✅ Deleting › does nothing when cancelled
- ✅ Lost admin rights › shows the API message when an action is forbidden

</details>

<details><summary><code>src/pages/CartPage.test.tsx</code> — 7/7 passed</summary>

- ✅ Adding to the cart › adds a car, updates the header count and keeps the cart after a reload
- ✅ Adding to the cart › never puts more in the cart than is in stock
- ✅ Adding to the cart › keeps carts separate per account
- ✅ Cart page › lists items with line totals and a subtotal, and adjusts quantities within stock
- ✅ Cart page › confirms the order: sends every line, shows the order and empties the cart
- ✅ Cart page › keeps the cart and explains when stock ran out before checkout
- ✅ Cart page › shows an empty state that links back to the showroom

</details>

<details><summary><code>src/pages/DashboardPage.test.tsx</code> — 14/14 passed</summary>

- ✅ Dashboard: vehicle list › shows every vehicle with category, price and stock, using the session token
- ✅ Dashboard: vehicle list › shows a loading state first
- ✅ Dashboard: vehicle list › shows an error with a retry button when loading fails
- ✅ Dashboard: vehicle list › shows an empty state when the showroom has no vehicles
- ✅ Dashboard: vehicle list › signs the user out when the session has expired
- ✅ Dashboard: purchasing › disables Purchase only for out-of-stock vehicles
- ✅ Dashboard: purchasing › buys one unit, updates the stock shown and confirms the purchase
- ✅ Dashboard: purchasing › prevents a double purchase while the request is in flight
- ✅ Dashboard: purchasing › explains a sold-out conflict and refreshes the stock
- ✅ Dashboard: search and filters › searches by make as the user types
- ✅ Dashboard: search and filters › filters by category
- ✅ Dashboard: search and filters › sends a price range
- ✅ Dashboard: search and filters › flags a minimum above the maximum without searching
- ✅ Dashboard: search and filters › shows a no-results message and clears filters back to the full list

</details>

<details><summary><code>src/pages/LoginPage.test.tsx</code> — 6/6 passed</summary>

- ✅ Login page › signs in, stores the session and lands on the dashboard
- ✅ Login page › validates required fields without calling the API
- ✅ Login page › shows the server message for wrong credentials and stays on the page
- ✅ Login page › explains when too many attempts were made
- ✅ Login page › disables the button while signing in to prevent double submits
- ✅ Login page › links to registration

</details>

<details><summary><code>src/pages/OrdersPages.test.tsx</code> — 9/9 passed</summary>

- ✅ My orders › groups each order with its lines, date and total
- ✅ My orders › points to the showroom when there are no orders yet
- ✅ My orders › shows an error with retry when loading fails
- ✅ My orders › is reachable from the header navigation
- ✅ All orders (admin) › shows every order with its customer, plus revenue and units sold
- ✅ All orders (admin) › filters orders by customer or vehicle as the admin types
- ✅ All orders (admin) › is linked in the header for admins only
- ✅ All orders (admin) › sends regular users back to the showroom and hides the link
- ✅ All orders (admin) › shows the API message if admin rights were removed

</details>

<details><summary><code>src/pages/RegisterPage.test.tsx</code> — 6/6 passed</summary>

- ✅ Register page › creates the account, signs the user in and lands on the dashboard
- ✅ Register page › blocks a short password before calling the API
- ✅ Register page › blocks mismatched passwords before calling the API
- ✅ Register page › blocks an invalid email before calling the API
- ✅ Register page › blocks a missing name before calling the API
- ✅ Register page › shows the server message when the email is already registered

</details>

<details><summary><code>src/pages/SignInAndHome.test.tsx</code> — 3/3 passed</summary>

- ✅ Single sign-in form › has no customer/admin choice: the account decides
- ✅ Single sign-in form › gives an admin account its admin features after a normal sign-in
- ✅ Home page headline › explains what the site is before the inventory

</details>

<details><summary><code>src/pages/VehicleDetailPage.test.tsx</code> — 6/6 passed</summary>

- ✅ Vehicle detail page › opens from the showroom card
- ✅ Vehicle detail page › shows price, stock, basic details and the description
- ✅ Vehicle detail page › shows a photo gallery with credits, and switches photos from the thumbnails
- ✅ Vehicle detail page › can add the car to the cart
- ✅ Vehicle detail page › falls back to the illustration when a car has no photos
- ✅ Vehicle detail page › explains when the vehicle does not exist and links back

</details>
