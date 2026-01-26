import React, { lazy, Suspense } from 'react';
import styled from 'styled-components';
import SEO from '../../components/common/SEO';

const AlliancePlan = lazy(() => import('../../components/alliancePlan'));
const PartnershipAndRecruit = lazy(() => import('../../components/partnershipAndRecruit'));

const PageContainer = styled.div`
  width: 100%;
`;

const PartnerPage = () => {
    return (
        <PageContainer>
            <SEO
                title="合作與招募 | Let's Play 桌球聯盟"
                description="加入 Let’s Play 桌球聯盟，我們提供跨業合作、教練招募與聯盟計畫，共同推廣桌球運動。"
            />
            <Suspense fallback={null}>
                <AlliancePlan />
                <PartnershipAndRecruit />
            </Suspense>
        </PageContainer>
    );
};

export default PartnerPage;
