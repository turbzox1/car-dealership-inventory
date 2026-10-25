import { Request, Response } from 'express';
import { VehicleService } from '../services/VehicleService';

/** Thin HTTP layer over VehicleService; input is validated by middleware first. */
export class VehicleController {
  constructor(private readonly vehicles: VehicleService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.vehicles.create(req.body));
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.vehicles.list());
  };

  get = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    res.json(await this.vehicles.get(req.params.id));
  };

  search = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.vehicles.search(res.locals.query));
  };

  update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    res.json(await this.vehicles.update(req.params.id, req.body));
  };

  delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    await this.vehicles.delete(req.params.id);
    res.status(204).end();
  };
}
