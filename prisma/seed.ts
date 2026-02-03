import { prismaClient } from '../src/db/prisma.ts';

const dinosaurs = [
  {
    name: 'Tyrannosaurus Rex',
    description: 'The king of the dinosaurs. This apex predator features powerful jaws capable of crushing bone and exceptional binocular vision. Height: 12ft at hip. Length: 40ft. Weight: 9 tons.',
    price: 25000000,
    tags: 'carnivore,theropod,cretaceous,apex-predator',
    image: 'https://images.unsplash.com/photo-1606856110002-d0991ce78250?w=800'
  },
  {
    name: 'Velociraptor',
    description: 'Highly intelligent pack hunters with razor-sharp claws. Known for problem-solving abilities and coordinated attacks. Height: 6ft. Length: 7ft. Weight: 150lbs.',
    price: 8500000,
    tags: 'carnivore,theropod,cretaceous,pack-hunter',
    image: 'https://images.unsplash.com/photo-1615243029542-4fcced64c70e?w=800'
  },
  {
    name: 'Triceratops',
    description: 'Three-horned herbivore with a distinctive frill. Gentle giant perfect for petting zoos. Excellent at landscaping. Height: 10ft. Length: 30ft. Weight: 12 tons.',
    price: 12000000,
    tags: 'herbivore,ceratopsian,cretaceous,gentle',
    image: 'https://images.unsplash.com/photo-1519656558520-f4c506a49c1c?w=800'
  },
  {
    name: 'Brachiosaurus',
    description: 'Massive long-necked sauropod reaching heights of 40+ feet. Peaceful leaf-eater ideal for safari viewing. Height: 50ft. Length: 85ft. Weight: 58 tons.',
    price: 35000000,
    tags: 'herbivore,sauropod,jurassic,gentle-giant',
    image: 'https://images.unsplash.com/photo-1601459427108-47e13b8c505c?w=800'
  },
  {
    name: 'Dilophosaurus',
    description: 'Medium-sized predator with distinctive twin crests. Features venomous spit capability and expandable neck frill. Height: 7ft. Length: 20ft. Weight: 900lbs.',
    price: 6500000,
    tags: 'carnivore,theropod,jurassic,venomous',
    image: 'https://images.unsplash.com/photo-1610825020498-6310df29fc10?w=800'
  },
  {
    name: 'Pteranodon',
    description: 'Majestic flying reptile with 20ft wingspan. Perfect for aerial shows and reconnaissance. Not technically a dinosaur but equally impressive. Wingspan: 20ft. Weight: 55lbs.',
    price: 4500000,
    tags: 'carnivore,pterosaur,cretaceous,flying',
    image: 'https://images.unsplash.com/photo-1559700493-2f5a7dc77e94?w=800'
  },
  {
    name: 'Stegosaurus',
    description: 'Iconic plated dinosaur with spiked tail (thagomizer). Docile herbivore with distinctive back plates. Height: 14ft. Length: 30ft. Weight: 5 tons.',
    price: 9800000,
    tags: 'herbivore,stegosaurid,jurassic,armored',
    image: 'https://images.unsplash.com/photo-1616728238498-083cbb77f9e0?w=800'
  },
  {
    name: 'Gallimimus',
    description: 'Swift ostrich-like dinosaur capable of speeds up to 50mph. Omnivorous and easily trainable. Perfect for racing. Height: 8ft. Length: 20ft. Weight: 970lbs.',
    price: 3200000,
    tags: 'omnivore,ornithomimid,cretaceous,fast',
    image: 'https://images.unsplash.com/photo-1587825045005-a21739925a4f?w=800'
  },
  {
    name: 'Spinosaurus',
    description: 'Largest carnivorous dinosaur ever. Semi-aquatic hunter with distinctive sail. Rivals T-Rex in power. Height: 16ft. Length: 50ft. Weight: 10 tons.',
    price: 28000000,
    tags: 'carnivore,theropod,cretaceous,aquatic,apex-predator',
    image: 'https://images.unsplash.com/photo-1597824381951-dca5ab564b15?w=800'
  },
  {
    name: 'Ankylosaurus',
    description: 'Living tank with armored plating and devastating tail club. Nearly impervious to predator attacks. Height: 5.5ft. Length: 25ft. Weight: 6 tons.',
    price: 11000000,
    tags: 'herbivore,ankylosaurid,cretaceous,armored,tank',
    image: 'https://images.unsplash.com/photo-1562155955-1cb2d73488d7?w=800'
  },
  {
    name: 'Parasaurolophus',
    description: 'Distinctive crested hadrosaur known for musical calls. Social species that thrives in herds. Height: 16ft. Length: 36ft. Weight: 5 tons.',
    price: 7500000,
    tags: 'herbivore,hadrosaur,cretaceous,social',
    image: 'https://images.unsplash.com/photo-1598977642010-fed487b65667?w=800'
  },
  {
    name: 'Mosasaurus',
    description: 'Apex marine predator of the ancient seas. Star attraction for aquatic exhibits. Length: 50ft. Weight: 15 tons. Requires specialized containment.',
    price: 42000000,
    tags: 'carnivore,marine-reptile,cretaceous,aquatic,apex-predator',
    image: 'https://images.unsplash.com/photo-1605101100278-5d1deb2b6498?w=800'
  }
];

async function seed() {
  console.log('Updating dinosaurs with images...');

  for (const dino of dinosaurs) {
    const existing = await prismaClient.product.findFirst({
      where: { name: dino.name }
    });

    if (existing) {
      await prismaClient.product.update({
        where: { id: existing.id },
        data: { image: dino.image }
      });
      console.log('Updated:', dino.name);
    } else {
      await prismaClient.product.create({ data: dino });
      console.log('Created:', dino.name);
    }
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
