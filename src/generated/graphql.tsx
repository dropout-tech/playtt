import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Time: any;
};

export type Calendar = {
  __typename?: "Calendar";
  classId?: Maybe<Scalars["ID"]>;
  className?: Maybe<Scalars["String"]>;
  classStatus?: Maybe<Scalars["String"]>;
  coach?: Maybe<Array<Maybe<Coach>>>;
  date?: Maybe<Scalars["Int"]>;
  endTime?: Maybe<Scalars["Int"]>;
  startTime?: Maybe<Scalars["Int"]>;
};

export type Calendars = {
  __typename?: "Calendars";
  calendars?: Maybe<Array<Maybe<Calendar>>>;
};

export type ClassCalendar = {
  __typename?: "ClassCalendar";
  data?: Maybe<Array<Maybe<Calendars>>>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
  total?: Maybe<Scalars["Int"]>;
};

export type ClassCoach = {
  __typename?: "ClassCoach";
  classCoachId: Scalars["ID"];
  classId?: Maybe<Scalars["ID"]>;
  coach?: Maybe<User>;
  coachId?: Maybe<Scalars["ID"]>;
};

export type ClassDate = {
  endTime: Scalars["Int"];
  startTime: Scalars["Int"];
};

export type ClassFilterOptions = {
  classDate?: InputMaybe<Scalars["Int"]>;
  classEndTime?: InputMaybe<Scalars["Int"]>;
  className?: InputMaybe<Scalars["String"]>;
  classStartTime?: InputMaybe<Scalars["Int"]>;
  classStatus?: InputMaybe<Scalars["String"]>;
  classTypes?: InputMaybe<Scalars["String"]>;
  coachName?: InputMaybe<Scalars["String"]>;
  couchId?: InputMaybe<Scalars["ID"]>;
  dateType?: InputMaybe<Scalars["String"]>;
};

export type ClassInput = {
  classEndDate: Scalars["Int"];
  classIntroduce: Scalars["String"];
  classMaxNum: Scalars["Int"];
  classMinNum: Scalars["Int"];
  className: Scalars["String"];
  classNumber: Scalars["Int"];
  classPrice: Scalars["Int"];
  classStartDate: Scalars["Int"];
  classStatus: Scalars["String"];
  classTypes: Scalars["String"];
  coachID: Array<InputMaybe<CoachId>>;
  date: Array<InputMaybe<ClassDate>>;
  sutibleMan: Scalars["String"];
};

export type ClassMutation = {
  __typename?: "ClassMutation";
  createClass?: Maybe<ClassResult>;
  deleteClass?: Maybe<ClassResult>;
  updateClass?: Maybe<ClassResult>;
};

export type ClassMutationCreateClassArgs = {
  input: ClassInput;
};

export type ClassMutationDeleteClassArgs = {
  classId: Scalars["ID"];
};

export type ClassMutationUpdateClassArgs = {
  classId: Scalars["ID"];
  input: UpdateClassInput;
};

export type ClassQuery = {
  __typename?: "ClassQuery";
  queryByClassName?: Maybe<ClassCalendar>;
  queryByClassName2?: Maybe<ClassesResult>;
  queryByCoach?: Maybe<ClassCalendar>;
  queryByCoach2?: Maybe<ClassesResult>;
  queryByCoachId?: Maybe<ClassCalendar>;
  queryByDate?: Maybe<ClassCalendar>;
};

export type ClassQueryQueryByClassNameArgs = {
  filter?: InputMaybe<ClassFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type ClassQueryQueryByClassName2Args = {
  filter?: InputMaybe<ClassFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type ClassQueryQueryByCoachArgs = {
  filter?: InputMaybe<ClassFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type ClassQueryQueryByCoach2Args = {
  filter?: InputMaybe<ClassFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type ClassQueryQueryByCoachIdArgs = {
  filter?: InputMaybe<ClassFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type ClassQueryQueryByDateArgs = {
  filter?: InputMaybe<ClassFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type ClassResult = {
  __typename?: "ClassResult";
  data?: Maybe<Classes>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type ClassTime = {
  __typename?: "ClassTime";
  classId?: Maybe<Scalars["ID"]>;
  classTimeId: Scalars["ID"];
  endTime?: Maybe<Scalars["Int"]>;
  startTime?: Maybe<Scalars["Int"]>;
};

export type ClassTimeId = {
  classTimeId?: InputMaybe<Scalars["ID"]>;
};

export type Classes = {
  __typename?: "Classes";
  classEndDate: Scalars["Int"];
  classId: Scalars["ID"];
  classIntroduce: Scalars["String"];
  classMaxNum: Scalars["Int"];
  classMinNum: Scalars["Int"];
  className: Scalars["String"];
  classNumber: Scalars["Int"];
  classPrice: Scalars["Int"];
  classStartDate: Scalars["Int"];
  classStatus: Scalars["String"];
  classTypes: Scalars["String"];
  coach?: Maybe<Array<Maybe<ClassCoach>>>;
  sutibleMan: Scalars["String"];
  time?: Maybe<Array<Maybe<ClassTime>>>;
  totalMember: Scalars["Int"];
};

export type ClassesResult = {
  __typename?: "ClassesResult";
  data?: Maybe<Array<Maybe<Classes>>>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type Coach = {
  __typename?: "Coach";
  coachName?: Maybe<Scalars["String"]>;
};

export type CoachId = {
  coachId: Scalars["ID"];
};

export type DeductionItem = {
  __typename?: "DeductionItem";
  deductionItemId?: Maybe<Scalars["ID"]>;
  deductionItemName?: Maybe<Scalars["String"]>;
  deductionItemPayment?: Maybe<Scalars["Int"]>;
  revenueId?: Maybe<Scalars["ID"]>;
};

export type DeductionItemInput = {
  deductionItemName?: InputMaybe<Scalars["String"]>;
  deductionItemPayment?: InputMaybe<Scalars["Int"]>;
};

export type Expenses = {
  __typename?: "Expenses";
  expensesType?: Maybe<Scalars["String"]>;
  payment?: Maybe<Scalars["Int"]>;
};

export type Income = {
  __typename?: "Income";
  incomeType?: Maybe<Scalars["String"]>;
  payment?: Maybe<Scalars["Int"]>;
};

export type IncreaseItem = {
  __typename?: "IncreaseItem";
  increaseItemId?: Maybe<Scalars["ID"]>;
  increaseItemName?: Maybe<Scalars["String"]>;
  increaseItemPayment?: Maybe<Scalars["Int"]>;
  revenueId?: Maybe<Scalars["ID"]>;
};

export type IncreaseItemInput = {
  increaseItemName?: InputMaybe<Scalars["String"]>;
  increaseItemPayment?: InputMaybe<Scalars["Int"]>;
};

export type Login = {
  email: Scalars["String"];
  password: Scalars["String"];
};

export type Mutation = {
  __typename?: "Mutation";
  Classes?: Maybe<ClassMutation>;
  Payment?: Maybe<PaymentMutation>;
  Register?: Maybe<RegisterMutation>;
  Revenue?: Maybe<RevenueMutation>;
  User?: Maybe<UserMutation>;
};

export type Pagination = {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type Payment = {
  __typename?: "Payment";
  classId?: Maybe<Scalars["ID"]>;
  payment?: Maybe<Scalars["Int"]>;
  paymentId?: Maybe<Scalars["ID"]>;
  paymentStatus?: Maybe<Scalars["String"]>;
  paymentTime?: Maybe<Scalars["Int"]>;
  paymentType?: Maybe<Scalars["String"]>;
  studentId?: Maybe<Scalars["ID"]>;
};

export type PaymentFilterOptions = {
  classType?: InputMaybe<Scalars["String"]>;
  endTime?: InputMaybe<Scalars["Int"]>;
  paymentStatus?: InputMaybe<Scalars["String"]>;
  paymentType?: InputMaybe<Scalars["String"]>;
  startTime?: InputMaybe<Scalars["Int"]>;
};

export type PaymentMutation = {
  __typename?: "PaymentMutation";
  updatePayment?: Maybe<PaymentResult>;
};

export type PaymentMutationUpdatePaymentArgs = {
  input: UpdatePaymentInput;
  paymentId: Scalars["ID"];
};

export type PaymentQuery = {
  __typename?: "PaymentQuery";
  queryPayment?: Maybe<PaymentQueryResult>;
  queryPaymentByClass?: Maybe<PaymentQueryResult>;
  queryPaymentByStudent?: Maybe<PaymentQueryResult>;
  queryPaymentByStudentID?: Maybe<PaymentQueryResult>;
};

export type PaymentQueryQueryPaymentArgs = {
  filter?: InputMaybe<PaymentFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type PaymentQueryQueryPaymentByClassArgs = {
  classname: Scalars["String"];
  filter?: InputMaybe<PaymentFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type PaymentQueryQueryPaymentByStudentArgs = {
  filter?: InputMaybe<PaymentFilterOptions>;
  pagination?: InputMaybe<Pagination>;
  student: Scalars["String"];
};

export type PaymentQueryQueryPaymentByStudentIdArgs = {
  pagination?: InputMaybe<Pagination>;
  studentId: Scalars["ID"];
};

export type PaymentQueryResult = {
  __typename?: "PaymentQueryResult";
  data?: Maybe<Array<Maybe<PaymentsQuery>>>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type PaymentResult = {
  __typename?: "PaymentResult";
  data?: Maybe<Payment>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type PaymentsQuery = {
  __typename?: "PaymentsQuery";
  StudentName?: Maybe<Scalars["String"]>;
  className?: Maybe<Scalars["String"]>;
  payment?: Maybe<Scalars["Int"]>;
  paymentStatus?: Maybe<Scalars["String"]>;
  paymentTime?: Maybe<Scalars["Int"]>;
  paymentType?: Maybe<Scalars["String"]>;
};

export type Query = {
  __typename?: "Query";
  Classes?: Maybe<ClassQuery>;
  Payment?: Maybe<PaymentQuery>;
  Register?: Maybe<RegisterQuery>;
  Revenue?: Maybe<RevenueQuery>;
  TestUser?: Maybe<UserResult>;
  User?: Maybe<UserQuery>;
};

export type QueryResult = {
  __typename?: "QueryResult";
  data?: Maybe<Array<Maybe<User>>>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type Register = {
  __typename?: "Register";
  classId: Scalars["ID"];
  classTimeId: Scalars["ID"];
  registerId: Scalars["ID"];
  student?: Maybe<Array<Maybe<RegisterStudent>>>;
};

export type RegisterDates = {
  __typename?: "RegisterDates";
  registerEndTime?: Maybe<Scalars["Int"]>;
  registerId?: Maybe<Scalars["ID"]>;
  registerName?: Maybe<Scalars["String"]>;
  registerStartTime?: Maybe<Scalars["Int"]>;
  registerStudents?: Maybe<Array<Maybe<RegisterStudents>>>;
};

export type RegisterFilterOptions = {
  registerStatus?: InputMaybe<Scalars["String"]>;
};

export type RegisterMutation = {
  __typename?: "RegisterMutation";
  createRegisterStudent?: Maybe<RegisterStudentResults>;
  deleteRegister?: Maybe<RegisterStudentResults>;
  updateRegisterStudent?: Maybe<RegisterStudentResult>;
};

export type RegisterMutationCreateRegisterStudentArgs = {
  input: RegisterStudentInput;
};

export type RegisterMutationDeleteRegisterArgs = {
  classId: Scalars["ID"];
  studentId: Scalars["ID"];
};

export type RegisterMutationUpdateRegisterStudentArgs = {
  RegisterStudentId: Scalars["ID"];
  filter?: InputMaybe<RegisterFilterOptions>;
  input?: InputMaybe<UpdateRegisterStudentInput>;
};

export type RegisterQuery = {
  __typename?: "RegisterQuery";
  queryRegisterByDate?: Maybe<RegisterQueryDateResult>;
};

export type RegisterQueryQueryRegisterByDateArgs = {
  date: Scalars["Int"];
  pagination?: InputMaybe<Pagination>;
};

export type RegisterQueryDateResult = {
  __typename?: "RegisterQueryDateResult";
  data?: Maybe<Array<Maybe<RegisterDates>>>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type RegisterStudent = {
  __typename?: "RegisterStudent";
  paymentId?: Maybe<Scalars["ID"]>;
  paymentStatus?: Maybe<Scalars["String"]>;
  registerId?: Maybe<Scalars["ID"]>;
  registerStatus?: Maybe<Scalars["String"]>;
  registerStudentId?: Maybe<Scalars["ID"]>;
  studentId?: Maybe<Scalars["ID"]>;
};

export type RegisterStudentInput = {
  classId?: InputMaybe<Scalars["ID"]>;
  classTimeId?: InputMaybe<Array<InputMaybe<ClassTimeId>>>;
  studentId?: InputMaybe<Scalars["ID"]>;
};

export type RegisterStudentResult = {
  __typename?: "RegisterStudentResult";
  data?: Maybe<RegisterStudent>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type RegisterStudentResults = {
  __typename?: "RegisterStudentResults";
  data?: Maybe<Array<Maybe<RegisterStudent>>>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type RegisterStudents = {
  __typename?: "RegisterStudents";
  phoneNumber?: Maybe<Scalars["String"]>;
  registerStatus?: Maybe<Scalars["String"]>;
  registerStudentId?: Maybe<Scalars["ID"]>;
  studentName?: Maybe<Scalars["String"]>;
};

export type Revenue = {
  __typename?: "Revenue";
  deduction?: Maybe<Array<Maybe<DeductionItem>>>;
  increase?: Maybe<Array<Maybe<IncreaseItem>>>;
  remark?: Maybe<Scalars["String"]>;
  revenueId: Scalars["ID"];
  revenueName?: Maybe<Scalars["String"]>;
  revenuePayType?: Maybe<Scalars["String"]>;
  revenuePayment?: Maybe<Scalars["Int"]>;
  revenueTime?: Maybe<Scalars["Int"]>;
  revenueType?: Maybe<Scalars["String"]>;
  sourceId?: Maybe<Scalars["ID"]>;
};

export type RevenueFilterOptions = {
  date?: InputMaybe<Scalars["Int"]>;
  revenueName?: InputMaybe<Scalars["String"]>;
  revenueType?: InputMaybe<Scalars["String"]>;
};

export type RevenueInput = {
  deduction?: InputMaybe<Array<InputMaybe<DeductionItemInput>>>;
  increase?: InputMaybe<Array<InputMaybe<IncreaseItemInput>>>;
  remark?: InputMaybe<Scalars["String"]>;
  revenueName: Scalars["String"];
  revenuePayType: Scalars["String"];
  revenuePayment: Scalars["Int"];
  revenueTime: Scalars["Int"];
  revenueType: Scalars["String"];
};

export type RevenueMutation = {
  __typename?: "RevenueMutation";
  createRevenue?: Maybe<RevenueResult>;
  deleteRevenue?: Maybe<RevenueResult>;
  updateRevenue?: Maybe<RevenueResult>;
};

export type RevenueMutationCreateRevenueArgs = {
  input: RevenueInput;
};

export type RevenueMutationDeleteRevenueArgs = {
  revenueId: Scalars["ID"];
};

export type RevenueMutationUpdateRevenueArgs = {
  input: UpdateRevenueInput;
  revenueId: Scalars["ID"];
};

export type RevenueQuery = {
  __typename?: "RevenueQuery";
  queryRevenueByMonth?: Maybe<RevenueQueryResult>;
  queryRevenueByYear?: Maybe<RevenueQueryYearResult>;
  queryRevenueReportByMonth?: Maybe<RevenueReportQueryResult>;
  queryRevenueReportByYear?: Maybe<RevenueReportQueryResult>;
  querySalary?: Maybe<SalaryQueryResult>;
};

export type RevenueQueryQueryRevenueByMonthArgs = {
  filter?: InputMaybe<RevenueFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type RevenueQueryQueryRevenueByYearArgs = {
  filter?: InputMaybe<RevenueFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type RevenueQueryQueryRevenueReportByMonthArgs = {
  month: Scalars["Int"];
  pagination?: InputMaybe<Pagination>;
  year: Scalars["Int"];
};

export type RevenueQueryQueryRevenueReportByYearArgs = {
  pagination?: InputMaybe<Pagination>;
  year: Scalars["Int"];
};

export type RevenueQueryQuerySalaryArgs = {
  filter?: InputMaybe<SalaryFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type RevenueQueryResult = {
  __typename?: "RevenueQueryResult";
  count?: Maybe<Scalars["Int"]>;
  data?: Maybe<Array<Maybe<Revenues>>>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
  totalExpenses?: Maybe<Scalars["Int"]>;
  totalRevenues?: Maybe<Scalars["Int"]>;
};

export type RevenueQueryYearResult = {
  __typename?: "RevenueQueryYearResult";
  count?: Maybe<Scalars["Int"]>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
  totalExpenses?: Maybe<Scalars["Int"]>;
  totalRevenues?: Maybe<Scalars["Int"]>;
};

export type RevenueReportQueryResult = {
  __typename?: "RevenueReportQueryResult";
  expenses?: Maybe<Array<Maybe<Expenses>>>;
  expensesTotal?: Maybe<Scalars["Int"]>;
  income?: Maybe<Array<Maybe<Income>>>;
  incomeTotal?: Maybe<Scalars["Int"]>;
  message?: Maybe<Scalars["String"]>;
  revenueTotal?: Maybe<Array<Maybe<RevenueTotal>>>;
  status?: Maybe<Scalars["Int"]>;
};

export type RevenueResult = {
  __typename?: "RevenueResult";
  data?: Maybe<Revenue>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type RevenueTotal = {
  __typename?: "RevenueTotal";
  amount?: Maybe<Scalars["Int"]>;
  date?: Maybe<Scalars["Int"]>;
  expense?: Maybe<Scalars["Int"]>;
  revenue?: Maybe<Scalars["Int"]>;
};

export type Revenues = {
  __typename?: "Revenues";
  remark?: Maybe<Scalars["String"]>;
  revenueId?: Maybe<Scalars["ID"]>;
  revenueName?: Maybe<Scalars["String"]>;
  revenuePayType?: Maybe<Scalars["String"]>;
  revenuePayment?: Maybe<Scalars["Int"]>;
  revenueTime?: Maybe<Scalars["Int"]>;
  revenueType?: Maybe<Scalars["String"]>;
};

export type Salary = {
  __typename?: "Salary";
  amount?: Maybe<Scalars["Int"]>;
  coachName?: Maybe<Scalars["String"]>;
  deduction?: Maybe<Scalars["Int"]>;
  emplomentType?: Maybe<Scalars["String"]>;
  increase?: Maybe<Scalars["Int"]>;
  revenueId?: Maybe<Scalars["ID"]>;
  revenuePayment?: Maybe<Scalars["Int"]>;
};

export type SalaryFilterOptions = {
  coachName?: InputMaybe<Scalars["String"]>;
  phoneNumber?: InputMaybe<Scalars["String"]>;
  salaryMonth: Scalars["Int"];
  salaryYear: Scalars["Int"];
};

export type SalaryQueryResult = {
  __typename?: "SalaryQueryResult";
  count?: Maybe<Scalars["Int"]>;
  data?: Maybe<Array<Maybe<Salary>>>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type UpdateClassDate = {
  classTimeId?: InputMaybe<Scalars["ID"]>;
  date?: InputMaybe<Scalars["Int"]>;
  endTime?: InputMaybe<Scalars["Int"]>;
  startTime?: InputMaybe<Scalars["Int"]>;
};

export type UpdateClassInput = {
  classEndDate?: InputMaybe<Scalars["Int"]>;
  classIntroduce?: InputMaybe<Scalars["String"]>;
  classMaxNum?: InputMaybe<Scalars["Int"]>;
  classMinNum?: InputMaybe<Scalars["Int"]>;
  className?: InputMaybe<Scalars["String"]>;
  classNumber?: InputMaybe<Scalars["Int"]>;
  classPrice?: InputMaybe<Scalars["Int"]>;
  classStartDate?: InputMaybe<Scalars["Int"]>;
  classStatus?: InputMaybe<Scalars["String"]>;
  classTypes?: InputMaybe<Scalars["String"]>;
  coachID?: InputMaybe<Array<InputMaybe<UpdateCoachId>>>;
  date?: InputMaybe<Array<InputMaybe<UpdateClassDate>>>;
  sutibleMan?: InputMaybe<Scalars["String"]>;
};

export type UpdateCoachId = {
  classCoachId: Scalars["ID"];
  coachId?: InputMaybe<Scalars["ID"]>;
};

export type UpdatePaymentInput = {
  paymentStatus: Scalars["String"];
  paymentType: Scalars["String"];
};

export type UpdateRegisterStudentInput = {
  classTimeId?: InputMaybe<Scalars["ID"]>;
  registerId?: InputMaybe<Scalars["ID"]>;
  studentId?: InputMaybe<Scalars["ID"]>;
};

export type UpdateRevenueInput = {
  deduction?: InputMaybe<Array<InputMaybe<DeductionItemInput>>>;
  increase?: InputMaybe<Array<InputMaybe<IncreaseItemInput>>>;
  remark?: InputMaybe<Scalars["String"]>;
  revenueName: Scalars["String"];
  revenuePayType: Scalars["String"];
  revenuePayment: Scalars["Int"];
  revenueTime: Scalars["Int"];
  revenueType: Scalars["String"];
};

export type UpdateUserInput = {
  birthDate?: InputMaybe<Scalars["String"]>;
  coachPhoto?: InputMaybe<Scalars["String"]>;
  emplomentType?: InputMaybe<Scalars["String"]>;
  experience?: InputMaybe<Scalars["String"]>;
  fullName?: InputMaybe<Scalars["String"]>;
  idNumber?: InputMaybe<Scalars["String"]>;
  license?: InputMaybe<Scalars["String"]>;
  memberStatus?: InputMaybe<Scalars["String"]>;
  nickName?: InputMaybe<Scalars["String"]>;
  password?: InputMaybe<Scalars["String"]>;
  personalAchievements?: InputMaybe<Scalars["String"]>;
  phone?: InputMaybe<Scalars["String"]>;
  salary?: InputMaybe<Scalars["Int"]>;
  teachingQualifications?: InputMaybe<Scalars["String"]>;
};

export type User = {
  __typename?: "User";
  birthDate?: Maybe<Scalars["String"]>;
  coachPhoto?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["Time"]>;
  email: Scalars["String"];
  emplomentType?: Maybe<Scalars["String"]>;
  experience?: Maybe<Scalars["String"]>;
  fullName?: Maybe<Scalars["String"]>;
  idNumber?: Maybe<Scalars["String"]>;
  license?: Maybe<Scalars["String"]>;
  memberStatus?: Maybe<Scalars["String"]>;
  nickName?: Maybe<Scalars["String"]>;
  password: Scalars["String"];
  personalAchievements?: Maybe<Scalars["String"]>;
  phone?: Maybe<Scalars["String"]>;
  salary?: Maybe<Scalars["Int"]>;
  teachingQualifications?: Maybe<Scalars["String"]>;
  userId: Scalars["ID"];
  userType?: Maybe<Scalars["String"]>;
};

export type UserFilterOptions = {
  fullName?: InputMaybe<Scalars["String"]>;
  phone?: InputMaybe<Scalars["String"]>;
};

export type UserInput = {
  birthDate?: InputMaybe<Scalars["String"]>;
  coachPhoto?: InputMaybe<Scalars["String"]>;
  email: Scalars["String"];
  emplomentType?: InputMaybe<Scalars["String"]>;
  experience?: InputMaybe<Scalars["String"]>;
  fullName?: InputMaybe<Scalars["String"]>;
  idNumber?: InputMaybe<Scalars["String"]>;
  license?: InputMaybe<Scalars["String"]>;
  memberStatus?: InputMaybe<Scalars["String"]>;
  nickName?: InputMaybe<Scalars["String"]>;
  password: Scalars["String"];
  personalAchievements?: InputMaybe<Scalars["String"]>;
  phone?: InputMaybe<Scalars["String"]>;
  salary?: InputMaybe<Scalars["Int"]>;
  teachingQualifications?: InputMaybe<Scalars["String"]>;
  userType?: InputMaybe<Scalars["String"]>;
};

export type UserMutation = {
  __typename?: "UserMutation";
  createUser?: Maybe<UserResult>;
  deleteUser?: Maybe<UserResult>;
  login?: Maybe<UserResult>;
  updateUser?: Maybe<UserResult>;
};

export type UserMutationCreateUserArgs = {
  input: UserInput;
};

export type UserMutationDeleteUserArgs = {
  userId: Scalars["ID"];
};

export type UserMutationLoginArgs = {
  input: Login;
};

export type UserMutationUpdateUserArgs = {
  input: UpdateUserInput;
  userId: Scalars["ID"];
};

export type UserQuery = {
  __typename?: "UserQuery";
  queryByCoach?: Maybe<QueryResult>;
  queryByStudent?: Maybe<QueryResult>;
  queryByUserID?: Maybe<UserResult>;
};

export type UserQueryQueryByCoachArgs = {
  filter?: InputMaybe<UserFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type UserQueryQueryByStudentArgs = {
  filter?: InputMaybe<UserFilterOptions>;
  pagination?: InputMaybe<Pagination>;
};

export type UserQueryQueryByUserIdArgs = {
  userId: Scalars["ID"];
};

export type UserResult = {
  __typename?: "UserResult";
  data?: Maybe<User>;
  message?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["Int"]>;
};

export type QueryByStudentQueryVariables = Exact<{ [key: string]: never }>;

export type QueryByStudentQuery = {
  __typename?: "Query";
  User?:
    | {
        __typename?: "UserQuery";
        queryByStudent?:
          | {
              __typename?: "QueryResult";
              data?:
                | Array<
                    { __typename?: "User"; userId: string } | null | undefined
                  >
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
};

export type TestUserQueryVariables = Exact<{ [key: string]: never }>;

export type TestUserQuery = {
  __typename?: "Query";
  TestUser?:
    | {
        __typename?: "UserResult";
        data?: { __typename?: "User"; userId: string } | null | undefined;
      }
    | null
    | undefined;
};

export const QueryByStudentDocument = gql`
  query QueryByStudent {
    User {
      queryByStudent(filter: {}, pagination: { offset: 0, limit: 10 }) {
        data {
          userId
        }
      }
    }
  }
`;

/**
 * __useQueryByStudentQuery__
 *
 * To run a query within a React component, call `useQueryByStudentQuery` and pass it any options that fit your needs.
 * When your component renders, `useQueryByStudentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQueryByStudentQuery({
 *   variables: {
 *   },
 * });
 */
export function useQueryByStudentQuery(
  baseOptions?: Apollo.QueryHookOptions<
    QueryByStudentQuery,
    QueryByStudentQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<QueryByStudentQuery, QueryByStudentQueryVariables>(
    QueryByStudentDocument,
    options
  );
}
export function useQueryByStudentLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    QueryByStudentQuery,
    QueryByStudentQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<QueryByStudentQuery, QueryByStudentQueryVariables>(
    QueryByStudentDocument,
    options
  );
}
export type QueryByStudentQueryHookResult = ReturnType<
  typeof useQueryByStudentQuery
>;
export type QueryByStudentLazyQueryHookResult = ReturnType<
  typeof useQueryByStudentLazyQuery
>;
export type QueryByStudentQueryResult = Apollo.QueryResult<
  QueryByStudentQuery,
  QueryByStudentQueryVariables
>;
export const TestUserDocument = gql`
  query TestUser {
    TestUser {
      data {
        userId
      }
    }
  }
`;

/**
 * __useTestUserQuery__
 *
 * To run a query within a React component, call `useTestUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useTestUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTestUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useTestUserQuery(
  baseOptions?: Apollo.QueryHookOptions<TestUserQuery, TestUserQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<TestUserQuery, TestUserQueryVariables>(
    TestUserDocument,
    options
  );
}
export function useTestUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    TestUserQuery,
    TestUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<TestUserQuery, TestUserQueryVariables>(
    TestUserDocument,
    options
  );
}
export type TestUserQueryHookResult = ReturnType<typeof useTestUserQuery>;
export type TestUserLazyQueryHookResult = ReturnType<
  typeof useTestUserLazyQuery
>;
export type TestUserQueryResult = Apollo.QueryResult<
  TestUserQuery,
  TestUserQueryVariables
>;
