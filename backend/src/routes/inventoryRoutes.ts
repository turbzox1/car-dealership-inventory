import { RequestHandler, Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validate';
import { purchaseSchema, restockSchema } from '../validation/inventorySchemas';

/** Mounted at /api. Each route declares its own auth so nothing else under /api is affected. */
export function createInventoryRoutes(controller: InventoryController, authenticate: RequestHandler): Router {
  const router = Router();
  router.post('/vehicles/:id/purchase', authenticate, validateBody(purchaseSchema), controller.purchase);
  router.post('/vehicles/:id/restock', authenticate, requireAdmin, validateBody(restockSchema), controller.restock);
  router.get('/purchases/me', authenticate, controller.myPurchases);
  router.get('/purchases', authenticate, requireAdmin, controller.allPurchases);
  return router;
}
