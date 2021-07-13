import { Request, Response, Router } from 'express';
import { Readable } from 'stream';
import readline from 'readline';

import multer from 'multer';
import { client } from './database/client';

const multerConfig = multer();

export const router = Router();

interface Product {
  code_bar: string;
  description: string;
  price: number;
  quantity: number;
}

router.post(
  '/products',
  multerConfig.single('file'),
  async (request: Request, response: Response) => {
    const { file } = request;
    const { buffer } = file;

    const readableFile = new Readable;
    readableFile.push(buffer);
    readableFile.push(null);

    const productLine = readline.createInterface({
      input: readableFile,
    });

    const products: Product[] = [];

    for await (let line of productLine) {
      const productLineSplit = line.split(',');
      products.push({
        code_bar: productLineSplit[0],
        description: productLineSplit[1],
        price: parseFloat(productLineSplit[2]),
        quantity: parseInt(productLineSplit[3]),
      });
    }

    for await (let product of products) {
      const { code_bar, description, price, quantity } = product;
      await client.product.create({
        data: {
          code_bar,
          description,
          price,
          quantity
        }
      });
    }

    return response.send(products);
  });

