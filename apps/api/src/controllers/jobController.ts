import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult, check } from 'express-validator';
import { Job } from '@prisma/client';

const prisma = new PrismaClient();

export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, description, price, skills } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Input validation for job creation fields
    await check('title', 'Title is required').not().isEmpty().run(req);
    await check('description', 'Description is required').not().isEmpty().run(req);
    await check('price', 'Price should be a number').isNumeric().run(req);

    const job = await prisma.job.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        skills: {
          connect: skills.map((id: number) => ({ id }))),
        },
      },
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error });
  }
};