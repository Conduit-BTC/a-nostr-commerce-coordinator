import { v4 as uuid } from 'uuid';
import { DEBUG_CTRL } from 'dev/utils/debugModeControls';
import type { CreateInvoiceResponse, StrikeBaseInvoiceResponse, StrikeQuoteResponse } from '@/types/types';

// See https://docs.strike.me/walkthrough/receiving-payments

const STRIKE_API_KEY = process.env.STRIKE_API_KEY!;

const testPaymentAmount = 0.000000011234;
if (DEBUG_CTRL.USE_TEST_PAYMENT_AMOUNT) console.warn(`\n===> DEBUG MODE ===> [StrikePaymentProvider] Using test payment amount of ${testPaymentAmount} Satoshi <<<\n`);

const headers = new Headers();
headers.append('Content-Type', 'application/json');
headers.append('Authorization', `Bearer ${STRIKE_API_KEY}`);
// headers.append('ContentLength', '0');

const requestOptions = {
    method: 'POST',
    headers
}

export async function generateInvoice(orderId: string, amountInSats: number): Promise<CreateInvoiceResponse> {
    try {
        if (DEBUG_CTRL.USE_TEST_PAYMENT_AMOUNT) console.log("\n===> DEBUG MODE ===> [generateInvoice]: USING FAKE AMOUNT FOR INVOICE GENERATION!\n");

        const generateBaseInvoiceResponse = await generateBaseInvoice(orderId, DEBUG_CTRL.USE_TEST_PAYMENT_AMOUNT ? testPaymentAmount : amountInSats);
        if (!generateBaseInvoiceResponse.success) return { success: false, message: generateBaseInvoiceResponse.message! };

        console.log(">>>>>>>>>> STRIKE RESPONSE:", generateBaseInvoiceResponse);

        const generateQuoteResponse = await generateQuote(generateBaseInvoiceResponse.invoiceId!);
        if (!generateQuoteResponse.success) return { success: false, message: generateQuoteResponse.message! };


        return { success: true, lightningInvoice: generateQuoteResponse.lightningInvoice, invoiceId: generateBaseInvoiceResponse.invoiceId };
    } catch (error) {
        console.error('[StrikePaymentProvider > generateInvoice]: Error creating Strike invoice:', error);
        return { success: false, message: 'Error creating Strike invoice' };
    }
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

async function generateQuote(invoiceId: string): Promise<StrikeQuoteResponse> {
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

export async function getStrikeInvoiceDetails(invoiceId: string) {
    try {
        const status = await fetch(`https://api.strike.me/v1/invoices/${invoiceId}`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
            }
        });
        const data = await status.json();
        if (data) return data;
        throw new Error('No data returned from Strike API');
    } catch (error) {
        console.error('[getStrikeInvoiceDetails]: ERROR: There was a problem checking Strike invoice details:', error);
    }
}
