import { prismaClient } from '../src/db/prisma.ts';

const dinosaurs = [
  {
    name: 'Tyrannosaurus Rex',
    description: 'The king of the dinosaurs. This apex predator features powerful jaws capable of crushing bone and exceptional binocular vision. Height: 12ft at hip. Length: 40ft. Weight: 9 tons.',
    price: 25000000,
    tags: 'carnivore,theropod,cretaceous,apex-predator',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Tyrannosaurus_Rex_Holotype.jpg/1280px-Tyrannosaurus_Rex_Holotype.jpg'
  },
  {
    name: 'Velociraptor',
    description: 'Highly intelligent pack hunters with razor-sharp claws. Known for problem-solving abilities and coordinated attacks. Height: 6ft. Length: 7ft. Weight: 150lbs.',
    price: 8500000,
    tags: 'carnivore,theropod,cretaceous,pack-hunter',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Velociraptor_Restoration.png/1280px-Velociraptor_Restoration.png'
  },
  {
    name: 'Triceratops',
    description: 'Three-horned herbivore with a distinctive frill. Gentle giant perfect for petting zoos. Excellent at landscaping. Height: 10ft. Length: 30ft. Weight: 12 tons.',
    price: 12000000,
    tags: 'herbivore,ceratopsian,cretaceous,gentle',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Triceratops_BW.jpg/1280px-Triceratops_BW.jpg'
  },
  {
    name: 'Brachiosaurus',
    description: 'Massive long-necked sauropod reaching heights of 40+ feet. Peaceful leaf-eater ideal for safari viewing. Height: 50ft. Length: 85ft. Weight: 58 tons.',
    price: 35000000,
    tags: 'herbivore,sauropod,jurassic,gentle-giant',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Brachiosaurus_DB.jpg/1280px-Brachiosaurus_DB.jpg'
  },
  {
    name: 'Dilophosaurus',
    description: 'Medium-sized predator with distinctive twin crests. Features venomous spit capability and expandable neck frill. Height: 7ft. Length: 20ft. Weight: 900lbs.',
    price: 6500000,
    tags: 'carnivore,theropod,jurassic,venomous',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Dilophosaurus_Restoration.png/1280px-Dilophosaurus_Restoration.png'
  },
  {
    name: 'Pteranodon',
    description: 'Majestic flying reptile with 20ft wingspan. Perfect for aerial shows and reconnaissance. Not technically a dinosaur but equally impressive. Wingspan: 20ft. Weight: 55lbs.',
    price: 4500000,
    tags: 'carnivore,pterosaur,cretaceous,flying',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pteranodon-longiceps_jconway.jpg/1280px-Pteranodon-longiceps_jconway.jpg'
  },
  {
    name: 'Stegosaurus',
    description: 'Iconic plated dinosaur with spiked tail (thagomizer). Docile herbivore with distinctive back plates. Height: 14ft. Length: 30ft. Weight: 5 tons.',
    price: 9800000,
    tags: 'herbivore,stegosaurid,jurassic,armored',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Stegosaurus_BW.jpg/1280px-Stegosaurus_BW.jpg'
  },
  {
    name: 'Gallimimus',
    description: 'Swift ostrich-like dinosaur capable of speeds up to 50mph. Omnivorous and easily trainable. Perfect for racing. Height: 8ft. Length: 20ft. Weight: 970lbs.',
    price: 3200000,
    tags: 'omnivore,ornithomimid,cretaceous,fast',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Gallimimus_Restoration.png/1280px-Gallimimus_Restoration.png'
  },
  {
    name: 'Spinosaurus',
    description: 'Largest carnivorous dinosaur ever. Semi-aquatic hunter with distinctive sail. Rivals T-Rex in power. Height: 16ft. Length: 50ft. Weight: 10 tons.',
    price: 28000000,
    tags: 'carnivore,theropod,cretaceous,aquatic,apex-predator',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Spinosaurus_2020_reconstruction.jpg/1280px-Spinosaurus_2020_reconstruction.jpg'
  },
  {
    name: 'Ankylosaurus',
    description: 'Living tank with armored plating and devastating tail club. Nearly impervious to predator attacks. Height: 5.5ft. Length: 25ft. Weight: 6 tons.',
    price: 11000000,
    tags: 'herbivore,ankylosaurid,cretaceous,armored,tank',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Ankylosaurus_magniventris_reconstruction.png/1280px-Ankylosaurus_magniventris_reconstruction.png'
  },
  {
    name: 'Parasaurolophus',
    description: 'Distinctive crested hadrosaur known for musical calls. Social species that thrives in herds. Height: 16ft. Length: 36ft. Weight: 5 tons.',
    price: 7500000,
    tags: 'herbivore,hadrosaur,cretaceous,social',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Parasaurolophus_cyrtocristatus.jpg/1280px-Parasaurolophus_cyrtocristatus.jpg'
  },
  {
    name: 'Mosasaurus',
    description: 'Apex marine predator of the ancient seas. Star attraction for aquatic exhibits. Length: 50ft. Weight: 15 tons. Requires specialized containment.',
    price: 42000000,
    tags: 'carnivore,marine-reptile,cretaceous,aquatic,apex-predator',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Mosasaurus_beaugei1DB.jpg/1280px-Mosasaurus_beaugei1DB.jpg'
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
