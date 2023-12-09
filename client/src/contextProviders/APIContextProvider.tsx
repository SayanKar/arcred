import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import { useGlobalContext } from './GlobalContextProvider';

interface IAPIContext {
    getMyCreditReport?: () => Promise<ResponseType<BorrowerStats>>,
    approveLender?: (lenderAddress: string, shouldApprove: boolean) => Promise<ResponseType<void>>,
    getBorrowerCreditReport?: (borrowerAddress: string) => Promise<ResponseType<BorrowerStats>>,
    registerLoan?: (loanType: number, description: string, amount: number, borrowerAddress: string) => Promise<ResponseType<number>>,
    reportBorrowerActivity?: (loanId: number, unsettledAmount: number, defaultAmount: number, lastUpdated: number) => Promise<ResponseType<number>>,
    closeLoan?: (loanId: number) => Promise<ResponseType<void>>,
    registerLender?: (lenderAddress: string) => Promise<ResponseType<void>>,
}

const APIContext = createContext<IAPIContext>({});
export const useApiContext = () => useContext(APIContext);

export type LoanInfo = {
    loanId: number,
    type: number,
    desc: string,
    creationTime: number,
    sanctionedAmount: number,
    lender: string,
    borrower: string,
    isActive: boolean, 
}

export type BorrowerStats = {
    creditScore: number,
    numberOfDefaults: number,
    numberOfCreditLineLoans: number,
    numberOfConsumerLoans: number,
}

export type LoanState = {
    loanId: number,
    unsettledAmount: number,
    defaultAmount: number,
    lastUpdated: number,
}

export type ResponseType<T> = {
    isError: boolean,
    message: string,
    item?: T,
}

function parseBorrowerStats(bS: any): BorrowerStats | undefined {
    if (
        bS &&
        bS.creditScore >= 0 &&
        bS.numberOfDefaults >= 0 &&
        bS.defaultAmount >= 0 &&
        bS.lastUpdated >= 0
    ) {
        return bS as BorrowerStats
    }

    return undefined
}

export const APIContextProvider  = ({children}: {children: ReactNode})  => {
    const { contract } = useGlobalContext();

    /**
     * FOR USERS
     */
    async function getMyCreditReport(): Promise<ResponseType<BorrowerStats>> {
        const response: ResponseType<BorrowerStats> = { isError: true, message: 'Internal error', item: undefined }
        try {
            const bS = await contract?.getMyCreditReport?.()
            const parsedBs = parseBorrowerStats(bS)
            console.log(parsedBs, bS)
            if (parsedBs) {
                response.isError = false
                response.message = 'Success'
                response.item = parsedBs
                return response
            }
        } catch(err) {
            console.log('error: getMyCreditReport:', err)
            response.message = 'Error while fetching Credit Report. See logs'
        }

        return response
    }

    async function approveLender(lenderAddress: string, shouldApprove: boolean = true): Promise<ResponseType<void>> {
        const response: ResponseType<void> = { isError: true, message: 'Internal error' }
        try {
            await contract?.approveLender?.(lenderAddress, shouldApprove)
            response.isError = false
            response.message = 'Success'
            return response
        } catch(err) {
            console.log('error: approveLender:', err)
            response.message = 'Error while approving lender. See logs'
        }

        return response
    }

    /**
     * FOR LENDER
    */
    async function getBorrowerCreditReport(borrowerAddress: string): Promise<ResponseType<BorrowerStats>> {
        const response: ResponseType<BorrowerStats> = { isError: true, message: 'Internal error', item: undefined }
        try {
            const bS = await contract?.getBorrowerCreditReport?.(borrowerAddress)
            const parsedBs = parseBorrowerStats(bS)
            if (parsedBs) {
                response.isError = false
                response.message = 'Success'
                response.item = parsedBs
                return response
            }
        } catch(err) {
            console.log('error: getBorrowerCreditReport:', err)
            response.message = 'Error while fetching Credit Report. See logs'
        }

        return response
    }

    async function registerLoan(
        loanType: number,
        description: string,
        amount: number,
        borrowerAddress: string
    ): Promise<ResponseType<number>> {
        const response: ResponseType<number> = { isError: true, message: 'Internal error', item: 0 }
        try {
            await contract?.registerLoan?.(loanType, description, amount, borrowerAddress)
            response.isError = false
            response.message = 'Success'
            return response
        } catch(err) {
            console.log('error: approveLender:', err)
            response.message = 'Error while approving lender. See logs'
        }

        return response
    }

    async function reportBorrowerActivity(
        loanId: number,
        unsettledAmount: number,
        defaultAmount: number,
        lastUpdated: number,
    ): Promise<ResponseType<number>> {
        const response: ResponseType<number> = { isError: true, message: 'Internal error', item: 0 }
        try {
            await contract?.reportBorrowerActivity?.(loanId, {
                loanId,
                unsettledAmount,
                defaultAmount,
                lastUpdated,
            })
            response.isError = false
            response.message = 'Success'
            return response
        } catch(err) {
            console.log('error: reportBorrowerActivity:', err)
            response.message = 'Error while reporting borrower activity. See logs'
        }

        return response
    }

    async function closeLoan(loanId: number): Promise<ResponseType<void>> {
        const response: ResponseType<void> = { isError: true, message: 'Internal error' }
        try {
            await contract?.closeLoan?.(loanId)
            response.isError = false
            response.message = 'Success'
            return response
        } catch(err) {
            console.log('error: closeLoan:', err)
            response.message = 'Error while closing loan. See logs'
        }

        return response
    }

    /**
     * FOR ADMIN
    */
    async function registerLender(lenderAddress: string): Promise<ResponseType<void>> {
        const response: ResponseType<void> = { isError: true, message: 'Internal error' }
        try {
            await contract?.registerLender?.(lenderAddress)
            response.isError = false
            response.message = 'Success'
            return response
        } catch(err) {
            console.log('error: registerLender:', err)
            response.message = 'Error while registering lender. See logs'
        }

        return response
    }

    return (
        <APIContext.Provider value={{
            getMyCreditReport,
            approveLender,

            getBorrowerCreditReport,
            registerLoan,
            reportBorrowerActivity,
            closeLoan,

            registerLender,
        }}>
            {children}
        </APIContext.Provider>
    )
}

export {}