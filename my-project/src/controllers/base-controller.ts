/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { BaseService } from '../services/base-service';

export abstract class BaseController<T> {
  constructor(
    protected service: BaseService<T>,
    protected entityName: string,
  ) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const items = await this.service.getAll();
      res.json(items);
    } catch (error) {
      console.error(`Error fetching ${this.entityName}s:`, error);
      res.status(500).json({
        error: `Failed to fetch ${this.entityName}s`,
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const item = await this.service.getById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: `${this.entityName} not found` });
      }
      res.json(item);
    } catch (error) {
      console.error(`Error fetching ${this.entityName}:`, error);
      res.status(500).json({ error: `Failed to fetch ${this.entityName}` });
    }
  };

  /**
   * Core create logic, exposed for overriding controllers
   */
  protected _create = async (req: Request, res: Response) => {
    try {
      const item = await this.service.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error(`Error creating ${this.entityName}:`, error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: `Failed to create ${this.entityName}` });
    }
  };

  create = this._create;

  /**
   * Core update logic, exposed for overriding controllers
   */
  protected _update = async (req: Request, res: Response) => {
    try {
      const item = await this.service.update(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      console.error(`Error updating ${this.entityName}:`, error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: `Failed to update ${this.entityName}` });
    }
  };

  update = this._update;

  delete = async (req: Request, res: Response) => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting ${this.entityName}:`, error);
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(500).json({ error: `Failed to delete ${this.entityName}` });
    }
  };
}
