import React, {createContext, ReactNode, useContext } from 'react';
import { useGlobalContext } from './GlobalContextProvider';

interface IAPIContext {
    getMyCreditReport: () => Promise<ResponseType<CreditReport>>,
    approveLender: (lenderAddress: string, shouldApprove: boolean) => Promise<ResponseType<void>>,
    getBorrowerCreditReport: (borrowerAddress: string) => Promise<ResponseType<BorrowerStats>>,
    registerLoan: (loanType: number, description: string, amount: number, borrowerAddress: string) => Promise<ResponseType<number>>,
    reportBorrowerActivity: (loanId: number, unsettledAmount: number, defaultAmount: number, lastUpdated: number) => Promise<ResponseType<number>>,
    closeLoan: (loanId: number) => Promise<ResponseType<void>>,
    registerLender: (lenderAddress: string) => Promise<ResponseType<void>>,

    isLenderApprovedByCurrentAccount: (lenderAddress: string) => Promise<ResponseType<boolean>>,
    getLoanDataFromLoanIds: (loanIds: number[]) => Promise<ResponseType<any>>,
    isLender: (lenderAddress: string) => Promise<ResponseType<boolean>>,
    getLoanIdsOfLender: (lenderAddress: string) => Promise<ResponseType<string[]>>,
    getLoanIdsOfBorrower: (borrowerAddress: string) => Promise<ResponseType<string[]>>,
}

const APIContext = createContext<IAPIContext>({} as IAPIContext);
export const useApiContext = () => useContext(APIContext);

export type LoanInfo = {
    loanId: string,
    type: number,
    desc: string,
    creationTime: string,
    sanctionedAmount: string,
    lender: string,
    borrower: string,
    isActive: boolean,
}

export type BorrowerStats = {
    creditScore: number,
    numberOfDefaults: number,
    numberOfCreditLines: number,
    numberOfConsumerLoans: number,
}

export type CreditReport = BorrowerStats & {
    loanData: LoanData[]
}

export type LoanState = {
    loanId: string,
    unsettledAmount: number,
    defaultAmount: number,
    lastUpdated: number,
}

export type LoanData = LoanInfo & LoanState

export type ResponseType<T> = {
    isError: boolean,
    message: string,
    item?: T,
}

function parseBorrowerStats(bS: any): BorrowerStats | undefined {
    if (
        bS &&
        typeof bS.creditScore === 'object' &&
        typeof bS.numberOfDefaults === 'object' &&
        typeof bS.numberOfCreditLines === 'object' &&
        typeof bS.numberOfConsumerLoans === 'object'
    ) {
        return {
            creditScore: bS.creditScore.toString(),
            numberOfDefaults: bS.numberOfDefaults.toString(),
            numberOfConsumerLoans: bS.numberOfConsumerLoans.toString(),
            numberOfCreditLines: bS.numberOfCreditLines.toString(),
        }
    }

    return undefined
}

function parseLoanDatas(loanDatas: any): LoanData[] {
    const parsedLoanDatas: LoanData[] = []

    if (Array.isArray(loanDatas)) {
        loanDatas.forEach((loanData) => {
            if (
                loanData &&
                loanData.loanInfo &&
                loanData.loanState &&
                typeof loanData.loanInfo.loanType === 'number' &&
                typeof loanData.loanInfo.creationTime === 'object' &&
                typeof loanData.loanInfo.sanctionedAmount === 'object' &&
                typeof loanData.loanState.loanId === 'object' &&
                typeof loanData.loanState.unsettledAmount === 'object' &&
                typeof loanData.loanState.defaultAmount === 'object' &&
                typeof loanData.loanState.lastUpdated === 'object' &&
                typeof loanData.loanInfo.desc === 'string' && loanData.loanInfo.desc.length >= 0 &&
                typeof loanData.loanInfo.lender === 'string' && loanData.loanInfo.lender.length >= 0 &&
                typeof loanData.loanInfo.borrower === 'string' && loanData.loanInfo.borrower.length >= 0 &&
                typeof loanData.loanInfo.isActive === 'boolean'
            ) {
                parsedLoanDatas.push({
                    desc: loanData.loanInfo.desc,
                    lender: loanData.loanInfo.lender,
                    borrower: loanData.loanInfo.borrower,
                    isActive: loanData.loanInfo.isActive,
                    type: loanData.loanInfo.loanType,
                    creationTime: loanData.loanInfo.creationTime.toString(),
                    sanctionedAmount: loanData.loanInfo.sanctionedAmount.toString(),
                    loanId: loanData.loanState.loanId.toString(),
                    unsettledAmount: loanData.loanState.unsettledAmount.toString(),
                    defaultAmount: loanData.loanState.defaultAmount.toString(),
                    lastUpdated: loanData.loanState.lastUpdated.toString(),
                })
            }
        })
    }

    return parsedLoanDatas
}

export const APIContextProvider  = ({children}: {children: ReactNode})  => {
    const { contract, account } = useGlobalContext();

    /**
     * FOR USERS
     */
    async function getMyCreditReport(): Promise<ResponseType<CreditReport>> {
        const response: ResponseType<CreditReport> = { isError: true, message: 'Internal error', item: undefined }
        try {
            const cR = await contract?.getMyCreditReport?.()
            const parsedBs = parseBorrowerStats(cR.borrowerStats)
            const loanDataResponse = await getLoanDataFromLoanIds(cR.loanIds)

            if (parsedBs && !loanDataResponse.isError && loanDataResponse.item) {
                response.isError = false
                response.message = 'Success'
                response.item = {...parsedBs, loanData: loanDataResponse.item}
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

    /**
     * HELPER FUNCTIONs
    */
    async function isLenderApprovedByCurrentAccount(lenderAddress: string): Promise<ResponseType<boolean>> {
        const response: ResponseType<boolean> = { isError: true, message: 'Internal error', item: undefined }
        try {
            const isApproved = await contract?.isLenderApproved?.(lenderAddress, account)
            response.isError = false
            response.message = 'Success'
            response.item = isApproved
            return response
        } catch(err) {
            console.log('error: isApprovedLender:', err)
            response.message = 'Error while fetching approved lender. See logs'
        }

        return response
    }

    async function isLender(lenderAddress: string): Promise<ResponseType<boolean>> {
        const response: ResponseType<boolean> = { isError: true, message: 'Internal error', item: undefined }
        try {
            const isLenderResponse = await contract?.isLender?.(lenderAddress)
            response.isError = false
            response.message = 'Success'
            response.item = isLenderResponse
            return response
        } catch(err) {
            console.log('error: isLender:', err)
            response.message = 'Error while fetching is lender response. See logs'
        }

        return response
    }

    async function getLoanDataFromLoanIds(loanIds: number[]): Promise<ResponseType<LoanData[]>> {
        const response: ResponseType<LoanData[]> = { isError: true, message: 'Internal error', item: undefined }
        try {
            const loanDatas = await contract?.getLoanDataForLoanIds?.(loanIds)
            const parsedLoanDatas = parseLoanDatas(loanDatas)
            response.isError = false
            response.message = 'Success'
            response.item = parsedLoanDatas
            return response
        } catch(err) {
            console.log('error: getLoanDataFromLoanIds:', err)
            response.message = 'Error while fetching loan data. See logs'
        }

        return response
    }

    async function getLoanIdsOfLender(lenderAddress: string): Promise<ResponseType<string[]>> {
        const response: ResponseType<string[]> = { isError: true, message: 'Internal error', item: undefined }
        try {
            const loanIds = await contract?.lenderToLoanId?.(lenderAddress)
            response.isError = false
            response.message = 'Success'
            response.item = loanIds
            return response
        } catch(err) {
            console.log('error: getLoanIdsOfLender:', err)
            response.message = 'Error while fetching loan ids for the lender. See logs'
        }

        return response
    }

    async function getLoanIdsOfBorrower(borrowerAddress: string): Promise<ResponseType<string[]>> {
        const response: ResponseType<string[]> = { isError: true, message: 'Internal error', item: undefined }
        try {
            const loanIds = await contract?.borrowerToLoanId?.(borrowerAddress)
            response.isError = false
            response.message = 'Success'
            response.item = loanIds
            return response
        } catch(err) {
            console.log('error: getLoanIdsOfBorrower:', err)
            response.message = 'Error while fetching loan ids for the borrower. See logs'
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

            isLenderApprovedByCurrentAccount,
            getLoanDataFromLoanIds,
            isLender,
            getLoanIdsOfLender,
            getLoanIdsOfBorrower,
        }}>
            {children}
        </APIContext.Provider>
    )
}

export {}