import crypto from "crypto"
import { prisma } from './prisma'

export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

export const createOTP = async (userId: string, channel: "EMAIL" | "PHONE") => {
    // Invalidate any existing unused OTP for same channel
    await prisma.otpCode.updateMany({
        where: { userId, channel, used: false },
        data: { used: true },
    });


    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
        data: { userId, code, channel, expiresAt },
    })
    return code;
};

export const verifyOTP = async (userId: string, code: string, channel: "EMAIL" | "PHONE",): Promise<boolean> => {
    const otp = await prisma.otpCode.findFirst({
        where: {
            userId,
            code,
            channel,
            used: false,
            expiresAt: { gte: new Date(), }
        },
    });

    if (!otp) return false;

    await prisma.otpCode.update({
        where: { id: otp.id },
        data: { used: true },
    });

    // Mark user as verified for this channel
    const field = channel === "EMAIL" ? "emailVerified" : "PhoneVerified";
    await prisma.user.update({
        where: { id: userId },
        data: { [field]: true },
    });

    return true;
}

