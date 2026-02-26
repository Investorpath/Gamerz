const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findFirst({
        where: { username: 'testuser' },
        include: { ownerships: true }
    });

    const user2 = await prisma.user.findFirst({
        where: { username: 'tester_premium' },
        include: { ownerships: true }
    });

    const user3 = await prisma.user.findFirst({
        where: { username: 'tester1' },
        include: { ownerships: true }
    });

    const out = {
        TESTUSER: user,
        TESTER_PREMIUM: user2,
        TESTER1: user3
    };

    fs.writeFileSync('db_output.json', JSON.stringify(out, null, 2));
}

check().finally(() => prisma.$disconnect());
