import { Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';

/** Thin HTTP layer over InventoryService. Routes guarantee `req.user` is set. */
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  purchase = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const result = await this.inventory.purchase(req.user!.id, req.params.id, req.body.quantity);
    res.status(201).json(result);
  };

  restock = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    res.json(await this.inventory.restock(req.params.id, req.body.amount));
  };

  myPurchases = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.inventory.purchasesForUser(req.user!.id));
  };

  allPurchases = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.inventory.allPurchases());
  };

  checkout = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.inventory.checkout(req.user!.id, req.body.items));
  };

  myOrders = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.inventory.ordersForUser(req.user!.id));
  };

  allOrders = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.inventory.allOrders());
  };
}
