import { gql } from "@apollo/client";

export const QUERY_TEST_USER = gql`
  query QueryByStudent {
    User {
      queryByStudent(filter: {}, pagination: { offset: 0, limit: 10 }) {
        data {
          userId
        }
      }
    }
  }

  query TestUser {
    TestUser {
      data {
        userId
      }
    }
  }
`;
