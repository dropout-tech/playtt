import React from "react";
import styled from "styled-components";
import { media, theme } from "../styles/theme";
import { Container as SectionContainer } from "../styles/components";
import SectionHeader from "./common/SectionHeader";

// Emergency Photos from USER
import huangCorrect from "../assets/ourCouchMenber/huang-correct.jpg";
import yangCorrect from "../assets/ourCouchMenber/yang-correct.jpg";
import tsaiCorrect from "../assets/ourCouchMenber/tsai-correct.jpg";
import wangCorrect from "../assets/ourCouchMenber/wang-correct.jpg";

// Legacy Assets (Checking for correctness)
import coachImg1 from "../assets/ourCouchMenber/img1.png";
import coachImg2 from "../assets/ourCouchMenber/img2.png";
import coachImg3 from "../assets/ourCouchMenber/img3.png";
import coachImg4 from "../assets/ourCouchMenber/img4.png";
import coachWangYunHan from "../assets/ourCouchMenber/coach-wang-yunhan.jpg";

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
    "郭則寬": coachImg4, // Keeping this for now unless wrong
    "林培中": coachImg3,
    "楊秉翰": yangCorrect,
    "黃兆銨": huangCorrect,
    "王韻涵": coachWangYunHan,
    "蔡鎮宇": tsaiCorrect,
    "溫達威": coachImg2,
    "王泳程": wangCorrect,
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
                title: "學習歷程",
                items: ["蘆洲國小", "桃園國中", "壽山高中", "虎尾科技大學"],
            },
            {
                title: "教學相關歷程",
                items: ["大埤國小", "文昌國小", "大埤國中"],
            },
            {
                title: "教學特色",
                items: ["專注基礎技巧、量身訂製訓練、強調戰術與心理素質、實戰演練、提供即時回饋，全面提升學員桌球實力。"],
            },
            {
                title: "比賽成績",
                items: ["15歲青少年國手", "全中運團體第三名", "全大運團體第五名"],
            },
            {
                title: "帶隊成績",
                items: ["虎科盃國小組團體第五名"],
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
    {
        name: "王泳程",
        nickname: "程程",
        sections: [
            {
                title: "教學年資",
                items: ["8 年"],
            },
            {
                title: "學習歷程",
                items: ["桃園市立壽山高中", "彰化師範大學"],
            },
            {
                title: "教學經歷",
                items: ["新北市厚德國小教練"],
            },
            {
                title: "教學證照",
                items: ["C 級桌球教練"],
            },
            {
                title: "比賽成績",
                items: ["大專盃團體第四", "全中運團體第六"],
            },
            {
                title: "教學特色",
                items: ["強調基本功和小朋友姿勢有美有正確，並且耐心及細心地教導。"],
            },
        ],
    },
];

const PageContainer = styled.section`
  width: 100%;
  background: ${theme.colors.backgroundLight};
  padding: ${theme.spacing.xxl} 0;

  ${media.tablet} {
    padding: ${theme.spacing.xl} 0;
  }
`;

const Inner = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 0 ${theme.spacing.md};
  margin: 0 auto;

  ${media.tablet} {
    padding: 0 ${theme.spacing.sm};
  }
`;

const Header = styled.header`
  margin-bottom: ${theme.spacing.xl};
`;

const Hint = styled.p`
  font-family: ${theme.fonts.primary};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textLight};
  margin-top: ${theme.spacing.xs};
`;

const Grid = styled.div`
  display: grid;
  /* Use auto-fill with a minimum width for naturally responsive behavior */
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${theme.spacing.lg};

  ${media.tablet} {
     grid-template-columns: 1fr; /* Force 1 column on mobile */
     gap: ${theme.spacing.md};
  }
`;

const Card = styled.article`
  background: ${theme.colors.background};
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  border: 1px solid rgba(0, 0, 0, 0.03);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border-color: ${theme.colors.primary}20;
  }
`;

const PhotoContainer = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1; /* Robust square */
  overflow: hidden;
  background: #f0f0f0;
  position: relative;
`;

const Photo = styled.img<{ $isTsai?: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover; /* Strict non-distortion */
  object-position: ${props => props.$isTsai ? 'top center' : 'center'};
  transition: transform 0.5s ease;

  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const CardBody = styled.div`
  padding: ${theme.spacing.lg};
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  ${media.tablet} {
    padding: ${theme.spacing.md};
  }
`;

const NameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.sm};
`;

const Name = styled.h3`
  font-size: ${theme.fontSize.xxl};
  font-weight: ${theme.fontWeight.black};
  color: ${theme.colors.text};
  margin: 0;
  line-height: 1.2;
`;

const Nickname = styled.span`
  display: block;
  font-size: ${theme.fontSize.md};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.textLight};
  margin-top: 2px;
`;

const ExperienceTag = styled.span`
  background: ${theme.colors.primary}10;
  color: ${theme.colors.primary};
  padding: 4px 12px;
  border-radius: 99px;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.bold};
  white-space: nowrap;
`;

const HighlightList = styled.ul`
  margin: ${theme.spacing.sm} 0;
  padding-left: ${theme.spacing.md};
  list-style-type: none;
`;

const HighlightItem = styled.li`
  font-size: ${theme.fontSize.md};
  color: ${theme.colors.text};
  margin-bottom: 6px;
  position: relative;

  &::before {
    content: "•";
    color: ${theme.colors.primary};
    position: absolute;
    left: -15px;
    font-weight: bold;
  }
`;

const BioDetails = styled.details`
  margin-top: auto;
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.backgroundLight};

  &[open] summary svg {
    transform: rotate(180deg);
  }
`;

const BioSummary = styled.summary`
  list-style: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.primary};
  user-select: none;
  outline: none;

  &::-webkit-details-marker {
    display: none;
  }

  &:focus-visible {
    color: ${theme.colors.accent};
  }
`;

const BioContent = styled.div`
  padding-top: ${theme.spacing.md};
`;

const BioSection = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const BioLabel = styled.h4`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeight.black};
  margin-bottom: 4px;
  letter-spacing: 0.05em;
`;

const BioList = styled.ul`
  margin: 0;
  padding-left: 1.2em;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textLight};
  line-height: 1.6;
`;

function getHighlights(coach: Coach): string[] {
    const teaching = coach.sections.find(s => s.title === "教學特色")?.items ?? [];
    return teaching.slice(0, 2);
}

function getExperience(coach: Coach): string {
    const years = coach.sections.find(s => s.title === "教學年資")?.items?.[0];
    return years ? `教學 ${years}` : "專業教練";
}

const CoachList: React.FC = () => {
    return (
        <PageContainer id="ourCouchMembers">
            <SectionContainer>
                <Inner>
                    <Header>
                        <SectionHeader title="專業師資團隊" subtitle="Elite Teaching Staff" />
                        <Hint>我們引以為傲的教練群，為每一位學員量身打造專屬課程</Hint>
                    </Header>

                    <Grid>
                        {COACHES.map((coach) => {
                            const highlights = getHighlights(coach);
                            const experience = getExperience(coach);
                            const photoSrc = COACH_PHOTOS[coach.name];

                            return (
                                <Card key={coach.name}>
                                    <PhotoContainer>
                                        <Photo
                                            src={photoSrc}
                                            alt={`教練 ${coach.name}`}
                                            $isTsai={coach.name === "蔡鎮宇"}
                                            width={400}
                                            height={400}
                                            loading="lazy"
                                        />
                                    </PhotoContainer>
                                    <CardBody>
                                        <NameHeader>
                                            <div>
                                                <Name>{coach.name}</Name>
                                                {coach.nickname && <Nickname>（{coach.nickname}）</Nickname>}
                                            </div>
                                            <ExperienceTag>{experience}</ExperienceTag>
                                        </NameHeader>

                                        <HighlightList>
                                            {highlights.map((item, idx) => (
                                                <HighlightItem key={idx}>{item}</HighlightItem>
                                            ))}
                                        </HighlightList>

                                        <BioDetails>
                                            <BioSummary>
                                                查看完整履歷
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.3s ease' }}>
                                                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </BioSummary>
                                            <BioContent>
                                                {coach.sections.map((section) => (
                                                    <BioSection key={section.title}>
                                                        <BioLabel>{section.title}</BioLabel>
                                                        <BioList>
                                                            {section.items.map((item, i) => (
                                                                <li key={i}>{item}</li>
                                                            ))}
                                                        </BioList>
                                                    </BioSection>
                                                ))}
                                            </BioContent>
                                        </BioDetails>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </Grid>
                </Inner>
            </SectionContainer>
        </PageContainer>
    );
};

export default CoachList;

