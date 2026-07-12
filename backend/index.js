import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/api/test', async (req, res) => {
    try {
        let testRecord = await prisma.test.findFirst();
        if (!testRecord) {
            testRecord = await prisma.test.create({
                data: { message: 'Hello from PostgreSQL and Prisma!' }
            });
        }
        res.json({ success: true, data: testRecord, message: "Backend is connected to DB!" });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ success: false, error: 'Failed to connect to database' });
    }
});

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    try {
        await prisma.$connect();
        console.log(`Connected to PostgreSQL Database via Prisma`);
    } catch (error) {
        console.error(`Failed to connect to Database:`, error);
    }
});