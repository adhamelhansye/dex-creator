import { ethers } from "ethers";
import { PrismaClient } from "../lib/generated/orderly-client";
import { Decimal } from "../lib/generated/orderly-client/runtime/library";

interface OrderlyBrokerData {
  brokerId: string;
  brokerName: string;
  makerFee: number;
  takerFee: number;
}

const orderlyPrisma = new PrismaClient();

function generateBrokerHash(brokerId: string): string {
  const encoder = new TextEncoder();
  return ethers.keccak256(encoder.encode(brokerId));
}

function convertBasisPointsToDecimal(basisPoints: number): Decimal {
  const actualBasisPoints = basisPoints / 10;
  const decimal = actualBasisPoints / 10000;
  return new Decimal(decimal.toFixed(8));
}

export async function addBrokerToOrderlyDb(
  data: OrderlyBrokerData
): Promise<{ success: boolean; message: string }> {
  try {
    const brokerHash = generateBrokerHash(data.brokerId);
    const baseMakerFee = convertBasisPointsToDecimal(0);
    const baseTakerFee = convertBasisPointsToDecimal(25);
    const defaultMakerFee = convertBasisPointsToDecimal(data.makerFee);
    const defaultTakerFee = convertBasisPointsToDecimal(data.takerFee);

    await orderlyPrisma.orderlyBroker.create({
      data: {
        brokerId: data.brokerId,
        brokerName: data.brokerName,
        brokerHash: brokerHash,
        baseMakerFeeRate: baseMakerFee,
        baseTakerFeeRate: baseTakerFee,
        defaultMakerFeeRate: defaultMakerFee,
        defaultTakerFeeRate: defaultTakerFee,
        adminAccountId: null,
        rebateCap: new Decimal("1.00"),
        grossFeeEnable: false,
        lockedRebateAllocation: false,
        isAllSubsideTakerFee: false,
      },
    });

    console.log(
      `✅ Successfully added broker ${data.brokerId} to Orderly database`
    );

    return {
      success: true,
      message: `Broker ${data.brokerId} successfully added to Orderly database`,
    };
  } catch (error) {
    console.error("❌ Error adding broker to Orderly database:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return {
        success: false,
        message: `Broker ID ${data.brokerId} already exists in Orderly database`,
      };
    }

    return {
      success: false,
      message: `Failed to add broker to Orderly database: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function updateBrokerAdminAccountId(
  brokerId: string,
  adminAccountId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await orderlyPrisma.orderlyBroker.update({
      where: {
        brokerId: brokerId,
      },
      data: {
        adminAccountId: adminAccountId,
      },
    });

    console.log(
      `✅ Successfully updated admin account ID for broker ${brokerId} to ${adminAccountId}`
    );

    return {
      success: true,
      message: `Admin account ID updated successfully for broker ${brokerId}`,
    };
  } catch (error) {
    console.error("❌ Error updating admin account ID:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return {
        success: false,
        message: `Broker ID ${brokerId} not found in Orderly database`,
      };
    }

    return {
      success: false,
      message: `Failed to update admin account ID: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function deleteBrokerFromOrderlyDb(
  brokerId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await orderlyPrisma.orderlyBroker.delete({
      where: {
        brokerId: brokerId,
      },
    });

    console.log(
      `✅ Successfully deleted broker ${brokerId} from Orderly database`
    );

    return {
      success: true,
      message: `Broker ${brokerId} successfully deleted from Orderly database`,
    };
  } catch (error) {
    console.error("❌ Error deleting broker from Orderly database:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return {
        success: false,
        message: `Broker ID ${brokerId} not found in Orderly database`,
      };
    }

    return {
      success: false,
      message: `Failed to delete broker from Orderly database: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
