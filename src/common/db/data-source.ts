import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ProductEntity } from '@src/products/models/entity.products';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'myuser',
  password: 'mypassword',
  database: 'mydatabase',
  schema: 'public',
  synchronize: true,
  logging: false,
  entities: [ProductEntity],
});
