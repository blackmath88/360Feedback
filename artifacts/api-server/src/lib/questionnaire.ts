export interface Question {
  id: string;
  text: string;
  scaleMin: number;
  scaleMax: number;
  scaleLabels: Record<string, string>;
  allowComment: boolean;
}

export interface QuestionSection {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface QuestionnaireStructure {
  sections: QuestionSection[];
}

const scaleLabels = {
  "1": "Trifft gar nicht zu",
  "2": "Trifft wenig zu",
  "3": "Trifft teilweise zu",
  "4": "Trifft überwiegend zu",
  "5": "Trifft vollständig zu",
};

const selfIntroPrefix = "";
const externalIntroPrefix = "Die Führungsperson ";

function q(id: string, selfText: string, externalText?: string): { id: string; selfText: string; externalText: string } {
  return { id, selfText, externalText: externalText ?? externalIntroPrefix + selfText.charAt(0).toLowerCase() + selfText.slice(1) };
}

const QUESTIONS_RAW = [
  {
    sectionId: "vision",
    sectionTitle: "Vision & Ausrichtung",
    sectionDescription: "Fragen zur strategischen Ausrichtung und Zielsetzung",
    items: [
      q("v1", "Ich formuliere eine klare und inspirierende Vision für mein Team."),
      q("v2", "Ich verbinde die Teamziele mit der übergeordneten Unternehmensstrategie."),
      q("v3", "Ich kommuniziere den Sinn und Zweck der Arbeit meines Teams überzeugend."),
      q("v4", "Ich setze klare Prioritäten und Ziele für mein Team."),
    ],
  },
  {
    sectionId: "communication",
    sectionTitle: "Kommunikation",
    sectionDescription: "Fragen zur Kommunikationskompetenz und Gesprächsführung",
    items: [
      q("c1", "Ich kommuniziere offen und transparent mit meinem Team."),
      q("c2", "Ich höre aktiv zu und nehme die Perspektiven anderer ernst."),
      q("c3", "Ich gebe konstruktives und zeitnahes Feedback."),
      q("c4", "Ich passe meinen Kommunikationsstil an verschiedene Gesprächspartner an."),
    ],
  },
  {
    sectionId: "collaboration",
    sectionTitle: "Zusammenarbeit & Teamgestaltung",
    sectionDescription: "Fragen zur Förderung von Zusammenarbeit und Teamdynamik",
    items: [
      q("co1", "Ich schaffe ein Klima des Vertrauens und der psychologischen Sicherheit."),
      q("co2", "Ich fördere die Zusammenarbeit und den Wissensaustausch im Team."),
      q("co3", "Ich erkenne und nutze die unterschiedlichen Stärken der Teammitglieder."),
      q("co4", "Ich löse Konflikte konstruktiv und zeitnah."),
    ],
  },
  {
    sectionId: "development",
    sectionTitle: "Mitarbeiterentwicklung",
    sectionDescription: "Fragen zur Förderung und Entwicklung von Mitarbeitenden",
    items: [
      q("d1", "Ich fördere gezielt die berufliche Entwicklung meiner Teammitglieder."),
      q("d2", "Ich delegiere Aufgaben sinnvoll und gebe dabei Entwicklungsraum."),
      q("d3", "Ich erkenne Leistungen und Erfolge meines Teams an."),
      q("d4", "Ich unterstütze mein Team bei der Bewältigung von Herausforderungen."),
    ],
  },
  {
    sectionId: "decision",
    sectionTitle: "Entscheidungsfähigkeit",
    sectionDescription: "Fragen zur Entscheidungsfindung und Handlungsfähigkeit",
    items: [
      q("de1", "Ich treffe Entscheidungen zeitgerecht und begründe sie nachvollziehbar."),
      q("de2", "Ich beziehe relevante Personen in Entscheidungsprozesse ein."),
      q("de3", "Ich übernehme Verantwortung für meine Entscheidungen und deren Konsequenzen."),
      q("de4", "Ich bleibe auch unter Druck handlungsfähig und lösungsorientiert."),
    ],
  },
  {
    sectionId: "selfleadership",
    sectionTitle: "Selbstführung & Reflexion",
    sectionDescription: "Fragen zur Selbstwahrnehmung, Reflexionsfähigkeit und persönlichen Weiterentwicklung",
    items: [
      q("s1", "Ich reflektiere regelmässig mein eigenes Führungsverhalten."),
      q("s2", "Ich erkenne meine eigenen Stärken und Entwicklungsbereiche."),
      q("s3", "Ich zeige Offenheit für Feedback und lerne daraus."),
      q("s4", "Ich gehe mit Veränderungen und Unsicherheiten konstruktiv um."),
    ],
  },
];

export function getQuestionnaire(mode: "self" | "external" = "self"): QuestionnaireStructure {
  const sections: QuestionSection[] = QUESTIONS_RAW.map((section) => ({
    id: section.sectionId,
    title: section.sectionTitle,
    description: section.sectionDescription,
    questions: section.items.map((item) => ({
      id: item.id,
      text: mode === "self" ? item.selfText : item.externalText,
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels,
      allowComment: true,
    })),
  }));
  return { sections };
}

export function computeReportData(
  responseSets: Array<{ answers: Record<string, number | null>; type: "self" | "external" }>
): Record<string, unknown> {
  const questionnaire = getQuestionnaire("self");
  const sectionResults: Record<string, {
    title: string;
    selfAvg: number | null;
    externalAvg: number | null;
    questions: Array<{ id: string; text: string; selfScore: number | null; externalAvg: number | null }>;
  }> = {};

  for (const section of questionnaire.sections) {
    const selfSet = responseSets.find((r) => r.type === "self");
    const externalSets = responseSets.filter((r) => r.type === "external");

    const questionResults = section.questions.map((q) => {
      const selfScore = selfSet?.answers?.[q.id] ?? null;
      const externalScores = externalSets
        .map((r) => r.answers?.[q.id])
        .filter((v): v is number => typeof v === "number");
      const externalAvg = externalScores.length > 0
        ? externalScores.reduce((a, b) => a + b, 0) / externalScores.length
        : null;
      return { id: q.id, text: q.text, selfScore, externalAvg };
    });

    const selfScores = questionResults.map((q) => q.selfScore).filter((v): v is number => v !== null);
    const extAvgs = questionResults.map((q) => q.externalAvg).filter((v): v is number => v !== null);

    sectionResults[section.id] = {
      title: section.title,
      selfAvg: selfScores.length > 0 ? selfScores.reduce((a, b) => a + b, 0) / selfScores.length : null,
      externalAvg: extAvgs.length > 0 ? extAvgs.reduce((a, b) => a + b, 0) / extAvgs.length : null,
      questions: questionResults,
    };
  }

  return { sections: sectionResults };
}
