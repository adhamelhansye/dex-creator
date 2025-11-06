import { getPrisma } from "../lib/prisma";

export async function getSwapFeeConfigs(): Promise<
  Record<string, { fee_rate: number }>
> {
  try {
    const prismaClient = await getPrisma();

    const allDexes = await prismaClient.dex.findMany({
      include: {
        user: {
          select: {
            address: true,
          },
        },
      },
    });

    const result: Record<string, { fee_rate: number }> = {};

    for (const dex of allDexes) {
      result[dex.user.address] = {
        fee_rate:
          dex.isGraduated && dex.swapFeeBps != null ? dex.swapFeeBps / 100 : 0,
      };
    }

    return result;
  } catch (error) {
    console.error("Error fetching swap fee configs:", error);
    return {};
  }
}
