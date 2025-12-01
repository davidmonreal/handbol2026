/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<T>;
}

export abstract class BaseService<T> {
  constructor(protected repository: IRepository<T>) {}

  async getAll(): Promise<T[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async create(data: any): Promise<T> {
    return this.repository.create(data);
  }

  async update(id: string, data: any): Promise<T> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<T> {
    return this.repository.delete(id);
  }
}
