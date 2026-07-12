import prisma from './src/utils/prisma.js';

async function main() {
  const user = await prisma.user.findFirst({ where: { name: 'Aryan' } });
  console.log('Aryan user:', user);
  
  if (!user) return;

  const reqs = await prisma.assetRequest.findMany({
    where: {
      OR: [
        { requestedByUserId: user.id },
        { requestedBy: { department: { departmentHeadId: user.id } } }
      ]
    },
    include: {
      requestedBy: { include: { department: true } }
    }
  });

  console.log('Requests for Aryan:', JSON.stringify(reqs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
