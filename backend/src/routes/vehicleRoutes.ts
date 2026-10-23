import { RequestHandler, Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validateBody';
import { validateQuery } from '../middleware/validateQuery';
import { createVehicleSchema, searchVehicleSchema, updateVehicleSchema } from '../validation/vehicleSchemas';

/** Every vehicle route needs a logged-in user; changes to the catalogue are admin-only. */
export function createVehicleRoutes(controller: VehicleController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);

  router.get('/', controller.list);
  router.get('/search', validateQuery(searchVehicleSchema), controller.search);
  router.post('/', requireAdmin, validateBody(createVehicleSchema), controller.create);
  router.put('/:id', requireAdmin, validateBody(updateVehicleSchema), controller.update);
  router.delete('/:id', requireAdmin, controller.delete);
  return router;
}
