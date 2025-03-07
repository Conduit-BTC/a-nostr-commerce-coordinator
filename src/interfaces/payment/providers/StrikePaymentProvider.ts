import { v4 as uuid } from 'uuid';
import type { GenerateInvoiceResponse } from '../LightningInterface';

type StrikeResponse = {
    success: boolean;
    message?: string;
    strikeResponseData?: any;
    lightningInvoice?: string;
}

// See https://docs.strike.me/walkthrough/receiving-payments

const STRIKE_API_KEY = process.env.STRIKE_API_KEY!;
const TEST_PAYMENT_FLOW = process.env.TEST_PAYMENT_FLOW === "true";

const testPaymentAmount = 0.000000011234;
if (TEST_PAYMENT_FLOW) console.warn(`>>> DEV MODE: Using test payment amount of ${testPaymentAmount} Satoshi <<<`);

const headers = new Headers();
headers.append('Content-Type', 'application/json');
headers.append('Authorization', `Bearer ${STRIKE_API_KEY}`);
// headers.append('ContentLength', '0');

const requestOptions = {
    method: 'POST',
    headers
}

export async function generateInvoice(orderId: string, amountInSats: number): Promise<GenerateInvoiceResponse> {
    try {
        const generateBaseInvoiceResponse = await generateBaseInvoice(orderId, TEST_PAYMENT_FLOW ? testPaymentAmount : amountInSats);
        if (!generateBaseInvoiceResponse.success) return { success: false, message: generateBaseInvoiceResponse.message! };

        const generateQuoteResponse = await generateQuote(generateBaseInvoiceResponse.invoiceId!);
        if (!generateQuoteResponse.success) return { success: false, message: generateQuoteResponse.message! };

        return { success: true, lightningInvoice: generateQuoteResponse.lightningInvoice };
    } catch (error) {
        console.error('[StrikePaymentProvider > generateInvoice]: Error creating Strike invoice:', error);
        return { success: false, message: 'Error creating Strike invoice' };
    }
}

type StrikeBaseInvoiceResponse = {
    success: boolean;
    message?: string;
    invoiceId?: string;
}

async function generateBaseInvoice(orderId: string, amount: number): Promise<StrikeBaseInvoiceResponse> {
    try {
        const body = JSON.stringify({
            correlationId: uuid(),
            description: 'Invoice for ' + orderId,
            amount: {
                currency: 'BTC',
                amount,
            },
        })

        const strikeResponse = await fetch(`https://api.strike.me/v1/invoices`, { ...requestOptions, body })
            .then((response) => response.json())
            .then(async (data): Promise<StrikeBaseInvoiceResponse> => {
                if (data.invoiceId) return { success: true, invoiceId: data.invoiceId };
                throw new Error(data)
            })

        if (!strikeResponse.success) return { success: false, message: strikeResponse.message! };
        return strikeResponse;
    } catch (error) {
        console.error('[StrikePaymentProvider > generateInvoice]: Error creating Strike invoice:', error);
        return { success: false, message: 'Error creating Strike invoice' };
    }
}

async function generateQuote(invoiceId: string): Promise<StrikeResponse> {
    const options = {
        method: 'POST',
        headers
    }

    const lightningInvoice = await fetch(`https://api.strike.me/v1/invoices/${invoiceId}/quote`, options)
        .then((response) => response.json())
        .then((data) => {
            return data.lnInvoice;
        })

    return { success: true, lightningInvoice };


}
