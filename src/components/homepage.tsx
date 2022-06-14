import React from "react";
import styled from "styled-components";

<<<<<<< HEAD
import banner1440 from "../assets/homepage/banner1440.png";
import banner1024 from "../assets/homepage/banner1024.png";
import banner1280 from "../assets/homepage/banner1280.png";
import banner768 from "../assets/homepage/banner768.png";
import banner414 from "../assets/homepage/banner414.png";

=======
>>>>>>> master
// styled components start 

const PageContainer = styled.div`
  width:100%;
  height:100%;
  display: flex;
  flex-direction: column;
<<<<<<< HEAD

   @media screen and (max-width: 414px) {
=======
  margin-top: 80px;
  @media screen and (max-width: 768px) {
>>>>>>> master
    
  }
`;

const BannerImg1 = styled.img`
 @media screen and (min-width: 1440px) {
    display:flex;
    width:100%;
    height:100%;
  }

  @media screen and (max-width: 1440px) {
    display:flex;
    width:100%;
    height:100%;
  }

  @media screen and (max-width: 1280px) {
    display: none;
  }
  @media screen and (max-width: 1024px) {
   display: none;
  }
   @media screen and (max-width: 768px) {
    display: none;
   
   }
   @media screen and (max-width: 414px) {
    display: none;
   }
`;

const BannerImg2 = styled.img`
  @media screen and (min-width: 1440px) {
     display: none;
  }
  @media screen and (max-width: 1440px) {
    display: none;
  }
   
  @media screen and (max-width: 1280px) {
    width:100%;
    height:100%;
    display:flex;
  }
  @media screen and (max-width: 1024px) {
   display: none;
  }
   @media screen and (max-width: 768px) {
    display: none;
   
   }
   @media screen and (max-width: 414px) {
    display: none;
   }
`;

const BannerImg3 = styled.img`

  @media screen and (min-width: 1440px) {
     display: none;
  }
  @media screen and (max-width: 1440px) {
    display: none;
  }

  @media screen and (max-width: 1280px) {
    display: none;
  }
  @media screen and (max-width: 1024px) {
    width:100%;
    height:100%;
    display:flex;
  }
   @media screen and (max-width: 768px) {
    display: none;
   }
   @media screen and (max-width: 414px) {
    display: none;
   }
`;

const BannerImg4 = styled.img`

  @media screen and (min-width: 1440px) {
     display: none;
  }
  @media screen and (max-width: 1440px) {
    display: none;
  }

  @media screen and (max-width: 1280px) {
    display: none;
  }
  @media screen and (max-width: 1024px) {
   display: none;
  }
   @media screen and (max-width: 768px) {
    width:100%;
    height:100%;
    display:flex;
   }
   @media screen and (max-width: 414px) {
    display: none;
   }
`;

const BannerImg5 = styled.img`
  @media screen and (min-width: 1440px) {
     display: none;
  }
  @media screen and (max-width: 1440px) {
    display: none;
  }

  @media screen and (max-width: 1280px) {
    display: none;
  }
  @media screen and (max-width: 1024px) {
   display: none;
  }
   @media screen and (max-width: 768px) {
    display: none;
   }
   @media screen and (max-width: 414px) {
     width:100%;
     height:100%;
     display:flex;
   }
`;



const EmptyContainer = styled.div`

`;


/* desktop thw newest info style end */
const homepage = () => {
  return <PageContainer id="home">
    <EmptyContainer>
      <BannerImg1 src={banner1440} />
      <BannerImg2 src={banner1280} />
      <BannerImg3 src={banner1024} />
      <BannerImg4 src={banner768} />
      <BannerImg5 src={banner414} />

    </EmptyContainer>
  </PageContainer>;
};

export default homepage;
