import React from "react";
import styled from "styled-components";
import { theme } from "../styles/theme";
import { Container as SectionContainer } from "../styles/components";

import coachImg1 from "../assets/ourCouchMenber/img1.png";
import coachImg2 from "../assets/ourCouchMenber/img2.png";
import coachImg3 from "../assets/ourCouchMenber/img3.png";
import coachImg4 from "../assets/ourCouchMenber/img4.png";
import coachImg6 from "../assets/ourCouchMenber/img6.png";
import coachImg7 from "../assets/ourCouchMenber/img7.png";
import coachImg8 from "../assets/ourCouchMenber/img8.png";

type CoachSection = {
  title: string;
  items: string[];
};

type Coach = {
  name: string;
  nickname?: string;
  sections: CoachSection[];
};

type CoachWithPhoto = Coach & { photoSrc: string };

const COACH_PHOTOS: Record<string, string> = {
  郭則寬: coachImg4,
  林培中: coachImg3,
  楊秉翰: coachImg6,
  黃兆銨: coachImg7,
  王韻涵: coachImg1,
  蔡鎮宇: coachImg8,
  溫達威: coachImg2,
};

const COACHES: Coach[] = [
  {
    name: "郭則寬",
    nickname: "阿寬",
    sections: [
      {
        title: "教練歷程",
        items: ["華江高中運動中心", "台北市民權國小", "現任 Let’s Play 執行長"],
      },
      {
        title: "學習歷程",
        items: ["麗山國中體育班", "松山家商體育班", "宜蘭大學休閒產業與健康促進學系"],
      },
      {
        title: "比賽成績",
        items: [
          "全國自由杯錦標賽高中團體第五名",
          "中港澳臺兩岸四地交流賽單打第三名",
          "全國大專院校公開組團體第八名",
        ],
      },
      {
        title: "帶隊成績",
        items: ["國泰陳慈庭 104 年 15 歲青少年國手第 10 名", "105 年 15 歲青少年國手第 5 名", "107 年 18 歲青少年國手第 10 名"],
      },
      {
        title: "證照",
        items: ["C 級桌球教練證照", "B 級桌球教練證照", "C 級桌球裁判證照", "中華民國體適能協會健身指導員 C 級"],
      },
      {
        title: "教學特色",
        items: ["透過引導教學方式，讓不管是大學員小學員，皆能夠快速上手桌球。"],
      },
    ],
  },
  {
    name: "林培中",
    nickname: "派派",
    sections: [
      {
        title: "教練歷程",
        items: ["102 年桌球助理指導教練受邀請至中天新聞與記者對打", "105 年 7、8 月桌球校隊助理教練擔任雨農國小桌球校隊培訓員", "109 年 12 月至 7 月擔任華江高中校隊培訓員"],
      },
      {
        title: "學習歷程",
        items: ["台北市麗山國中", "臺北市立松山高商", "國立宜蘭大學休閒系學士學位"],
      },
      {
        title: "比賽成績",
        items: ["全國自由盃社男甲組團體第二名", "宜蘭縣桌球錦標賽團體冠軍", "全國大專院校運動會甲組團體第八名"],
      },
      {
        title: "證照",
        items: ["C 級桌球教練證照"],
      },
      {
        title: "教學特色",
        items: ["教學生動活潑，親和力十足。", "因應學員程度不同，給予適合的教學課程。"],
      },
    ],
  },
  {
    name: "楊秉翰",
    nickname: "羊羊",
    sections: [
      {
        title: "學習歷程",
        items: ["新莊國中體育班", "長榮中學體育班", "國立體育大學球類系"],
      },
      {
        title: "教學特色",
        items: ["透過遊戲讓學員產生興趣以及學習相關技術。", "靈活應對不同學習需求，並調整教學內容。"],
      },
      {
        title: "教學相關歷程",
        items: ["台南小霸王乒乓世界", "台南崇學國小", "台北雨農國小", "新北路亞實驗小學社團", "Let’s Play（過往任教）"],
      },
      {
        title: "比賽成績",
        items: ["自由盃高中團體第五"],
      },
      {
        title: "證照",
        items: ["中華桌協 C 級教練"],
      },
    ],
  },
  {
    name: "黃兆銨",
    nickname: "小銨",
    sections: [
      {
        title: "學習歷程",
        items: ["桃園永豐高中桌球隊", "國立台北教育大學體育系師資生"],
      },
      {
        title: "服務資歷",
        items: ["桃園市 文山國小桌球社團教練", "桃園市 中正國小桌球社團教練", "桃園市 桃園國中桌球社團教練", "桃園市 永豐高中桌球社團教練", "1v1 個別教練"],
      },
      {
        title: "教學理念",
        items: ["學得開心，對打球更有信心"],
      },
      {
        title: "比賽成績",
        items: [
          "全國國語日報盃高年級團體季軍",
          "全國國小觀音盃殿軍",
          "桃園市市長盃高中團體亞軍",
          "桃園市市長盃社會團體季軍",
          "全國中等學校運動會高中團體第五名",
        ],
      },
      {
        title: "教學特色",
        items: ["利用小口訣、遊戲的方式讓學生喜歡桌球，並用有耐心、細心的教學模式對待學生，讓學生更輕鬆學桌球。"],
      },
    ],
  },
  {
    name: "王韻涵",
    nickname: "Amber",
    sections: [
      {
        title: "學習歷程",
        items: ["新北市新興國小桌球隊畢業生", "苗栗縣維真國中體育班", "苗栗縣大同高中體育班", "國立體育大學球類系"],
      },
      {
        title: "教學特色",
        items: ["培養學生興趣，激起學生對運動的熱忱並開心運動。", "擅長以簡單易懂的教學模式，使學員能輕鬆學習基礎技巧與桌球知識。"],
      },
      {
        title: "教學相關歷程",
        items: ["Let's Play 蘆洲店", "雲林大埤國小桌球隊", "桃園大業國小桌球隊", "新北厚德國小桌球隊"],
      },
      {
        title: "比賽成績",
        items: ["110 全國中等學校運動會團體冠軍", "111 全國中等學校運動會團體亞軍", "112 全國中等學校運動會女雙亞軍"],
      },
    ],
  },
  {
    name: "蔡鎮宇",
    nickname: "小蔡",
    sections: [
      {
        title: "教練資料",
        items: ["資料更新中。"],
      },
    ],
  },
  {
    name: "溫達威",
    nickname: "威廉",
    sections: [
      {
        title: "學習歷程",
        items: ["元生國小體育班", "內壢國中體育班", "臺灣師範大學體育系"],
      },
      {
        title: "比賽成績",
        items: ["桃園市市長盃團體亞軍", "積分賽 2200 分以下冠軍／亞軍／季軍皆有"],
      },
      {
        title: "教學特色",
        items: ["透過耐心及基本動作的磨練及目標達成，能讓學生更容易上手，和其他項目的特色差異，並且從中感到成就感，引發主動學習動機！"],
      },
    ],
  },
];

const PageContainer = styled.div`
  width: 100%;
  background: ${theme.colors.backgroundLight};
`;

const Inner = styled.div`
  width: 100%;
  max-width: 1200px;
  padding-left: ${theme.spacing.md};
  padding-right: ${theme.spacing.md};
  margin: 0 auto;

  @media screen and (max-width: ${theme.breakpoints.tablet}) {
    padding-left: ${theme.spacing.sm};
    padding-right: ${theme.spacing.sm};
  }
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: ${theme.spacing.lg};

  @media screen and (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: ${theme.spacing.md};
  }
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxxl};
  line-height: 52px;
  letter-spacing: 0.04em;
  margin: 0;
  color: ${theme.colors.text};

  @media screen and (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSize.xxl};
    line-height: 40px;
  }
`;

const Subtitle = styled.p`
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.xxxl};
  line-height: 52px;
  letter-spacing: 0.04em;
  margin: -24px 0 0;
  color: ${theme.colors.textMuted};

  @media screen and (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSize.xxl};
    line-height: 40px;
    margin-top: -20px;
  }
`;

const Hint = styled.p`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.sm};
  line-height: 22px;
  margin: 0;
  color: ${theme.colors.textLight};
`;

const Grid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${theme.spacing.md};

  @media screen and (max-width: ${theme.breakpoints.desktop}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media screen and (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const Card = styled.article`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(26, 26, 26, 0.08);
  overflow: hidden;
  min-width: 0;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(26, 26, 26, 0.14);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

const Photo = styled.img`
  width: 100%;
  height: 240px;
  object-fit: cover;
  display: block;
  transition: transform 0.22s ease;

  @media screen and (max-width: ${theme.breakpoints.tablet}) {
    height: 220px;
  }
`;

const CardBody = styled.div`
  padding: ${theme.spacing.md};
`;

const MotionCard = styled(Card)`
  &:hover ${Photo} {
    transform: scale(1.02);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover ${Photo} {
      transform: none;
    }
  }
`;

const CoachHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: ${theme.spacing.sm};
`;

const CoachName = styled.h3`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: ${theme.fontSize.xxl};
  line-height: 32px;
  letter-spacing: 0.04em;
  color: ${theme.colors.text};
`;

const CoachNick = styled.span`
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.md};
  color: ${theme.colors.textLight};
  margin-left: 8px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: ${theme.colors.backgroundLight};
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.secondary};
  font-weight: ${theme.fontWeight.bold};
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
`;

const SummaryList = styled.ul`
  margin: 0;
  padding-left: 18px;
`;

const SummaryItem = styled.li`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  letter-spacing: 0.02em;
  color: ${theme.colors.text};
`;

const Details = styled.details`
  margin-top: ${theme.spacing.sm};
  border-top: 1px solid rgba(60, 61, 61, 0.12);
  padding-top: ${theme.spacing.sm};

  &[open] summary {
    color: ${theme.colors.primary};
  }
`;

const DetailsSummary = styled.summary`
  list-style: none;
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.bold};
  font-size: ${theme.fontSize.md};
  line-height: 28px;
  color: ${theme.colors.textLight};

  &::-webkit-details-marker {
    display: none;
  }
`;

const Chevron = styled.span`
  width: 10px;
  height: 10px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  transition: transform 0.2s ease;

  details[open] & {
    transform: rotate(-135deg);
  }
`;

const Section = styled.div`
  margin-top: ${theme.spacing.sm};
`;

const SectionLabel = styled.div`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.black};
  font-size: 14px;
  line-height: 22px;
  color: ${theme.colors.primary};
  margin-bottom: 6px;
`;

const SectionList = styled.ul`
  margin: 0;
  padding-left: 18px;
`;

const SectionItem = styled.li`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeight.normal};
  font-size: ${theme.fontSize.sm};
  line-height: 24px;
  color: ${theme.colors.text};
  word-break: break-word;
`;

function getSummaryItems(coach: Coach): string[] {
  const teaching = coach.sections.find((s) => s.title === "教學特色")?.items ?? [];
  if (teaching.length > 0) return teaching.slice(0, 2);

  const firstNonEmpty = coach.sections.find((s) => s.items.length > 0);
  return firstNonEmpty ? firstNonEmpty.items.slice(0, 2) : [];
}

const OurCouchMembers = () => {
  const coaches: CoachWithPhoto[] = COACHES.map((c) => ({
    ...c,
    photoSrc: COACH_PHOTOS[c.name] ?? coachImg8,
  }));

  return (
    <PageContainer id="ourCouchMembers">
      <SectionContainer>
        <Inner>
          <Header>
            <TitleGroup>
              <Title>師資介紹</Title>
              <Subtitle>Our Coach</Subtitle>
            </TitleGroup>
            <Hint>點選「展開」可查看完整教練履歷與證照</Hint>
          </Header>

          <Grid>
            {coaches.map((coach) => {
              const summaryItems = getSummaryItems(coach);
              const roleTag = coach.nickname ? `${coach.nickname}` : "教練";

              return (
                <MotionCard key={coach.name}>
                  <Photo src={coach.photoSrc} alt={`${coach.name}${coach.nickname ? `（${coach.nickname}）` : ""} 教練`} />
                  <CardBody>
                    <CoachHeader>
                      <CoachName>
                        {coach.name}
                        {coach.nickname ? <CoachNick>（{coach.nickname}）</CoachNick> : null}
                      </CoachName>
                      <Tag>{roleTag}</Tag>
                    </CoachHeader>

                    {summaryItems.length > 0 ? (
                      <SummaryList>
                        {summaryItems.map((item) => (
                          <SummaryItem key={`${coach.name}-summary-${item}`}>{item}</SummaryItem>
                        ))}
                      </SummaryList>
                    ) : null}

                    <Details>
                      <DetailsSummary>
                        展開完整資料 <Chevron aria-hidden />
                      </DetailsSummary>

                      {coach.sections.map((section) => (
                        <Section key={`${coach.name}-${section.title}`}>
                          <SectionLabel>{section.title}</SectionLabel>
                          <SectionList>
                            {section.items.map((item) => (
                              <SectionItem key={`${coach.name}-${section.title}-${item}`}>{item}</SectionItem>
                            ))}
                          </SectionList>
                        </Section>
                      ))}
                    </Details>
                  </CardBody>
                </MotionCard>
              );
            })}
          </Grid>
        </Inner>
      </SectionContainer>
    </PageContainer>
  );
};

export default OurCouchMembers;
