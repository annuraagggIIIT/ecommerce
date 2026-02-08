import 'dotenv/config';
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '0414',
  database: process.env.DATABASE_NAME || 'ecommerce',
  port: Number(process.env.DATABASE_PORT) || 3306,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true
});

const prisma = new PrismaClient({ adapter });

const dinoImages: Record<string, string> = {
  "t-rex": "/images/trex-emoji.svg",
  "tyrannosaurus": "/images/trex-emoji.svg",
  "trex": "/images/trex-emoji.svg",
  "spinosaurus": "/images/trex-emoji.svg",
  "dilophosaurus": "/images/trex-emoji.svg",
  "velociraptor": "/images/velociraptor.svg",
  "raptor": "/images/velociraptor.svg",
  "gallimimus": "/images/velociraptor.svg",
  "triceratops": "/images/triceratops.svg",
  "ankylosaurus": "/images/triceratops.svg",
  "brachiosaurus": "/images/sauropod-emoji.svg",
  "sauropod": "/images/sauropod-emoji.svg",
  "parasaurolophus": "/images/sauropod-emoji.svg",
  "stegosaurus": "/images/stegosaurus.svg",
  "pterodactyl": "/images/pterodactyl.svg",
  "pteranodon": "/images/pterodactyl.svg",
  "mosasaurus": "/images/pterodactyl.svg",
  "dodo": "/images/sauropod-emoji.svg",
};

async function updateProductImages() {
  const products = await prisma.product.findMany();

  console.log(`Found ${products.length} products`);

  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    let imageUrl = "/images/trex-emoji.svg"; // default

    for (const [key, url] of Object.entries(dinoImages)) {
      if (nameLower.includes(key)) {
        imageUrl = url;
        break;
      }
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { image: imageUrl }
    });

    console.log(`Updated ${product.name} with image: ${imageUrl}`);
  }

  console.log("Done updating product images!");
}

updateProductImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
