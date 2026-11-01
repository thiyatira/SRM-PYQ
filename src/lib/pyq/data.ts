/*
 * Course catalogue: Semester -> Subjects. Paper files are not listed here; they are
 * discovered from public/data/<code>/*.json at build time (see catalogue.server.ts)
 * and attached with buildCatalogue().
 */

export interface SubjectMeta {
  code: string; // folder name = subject code, e.g. "21CSS101J"
  name: string; // human-readable
  title: string; // "code: name" display string
}

export interface SubjectInfo extends SubjectMeta {
  files: string[];
}

interface SemesterMeta {
  id: number;
  name: string;
  subjects: SubjectMeta[];
}

export interface SemesterInfo {
  id: number;
  name: string;
  subjects: SubjectInfo[];
}

export type SubjectEntry = SubjectInfo & { semester: SemesterInfo };

/** Paper file names per subject code, as produced by scanPaperFiles(). */
export type PaperFiles = Record<string, string[]>;

/** Every subject code in the catalogue (the folders scanPaperFiles() looks in). */
export const SUBJECT_CODES: string[] = [];

const COURSES: SemesterMeta[] = [
  {
    id: 1,
    name: "Semester I",
    subjects: [
      {
        code: "21CSS101J",
        name: "Programming for Problem Solving",
        title: "21CSS101J: Programming for Problem Solving",
      },
      {
        code: "21GNH101J",
        name: "Philosophy of Engineering",
        title: "21GNH101J: Philosophy of Engineering",
      },
      {
        code: "21LEH103T",
        name: "French",
        title: "21LEH103T: French",
      },
      {
        code: "21BTB102T",
        name: "Introduction to Computational Biology",
        title: "21BTB102T: Introduction to Computational Biology",
      },
      {
        code: "21CYB101J",
        name: "Chemistry",
        title: "21CYB101J: Chemistry",
      },
    ],
  },
  {
    id: 2,
    name: "Semester II",
    subjects: [
      {
        code: "21LEH101T",
        name: "Communicative English",
        title: "21LEH101T: Communicative English",
      },
      {
        code: "21MAB102T",
        name: "Advanced Calculus and Complex Analysis",
        title: "21MAB102T: Advanced Calculus and Complex Analysis",
      },
      {
        code: "21PYB102J",
        name: "Semiconductor Physics and Computational Methods",
        title: "21PYB102J: Semiconductor Physics and Computational Methods",
      },
      {
        code: "21EES101T",
        name: "Electrical and Electronics Engineering",
        title: "21EES101T: Electrical and Electronics Engineering",
      },
      {
        code: "21CSC101T",
        name: "Object Oriented Design and Programming",
        title: "21CSC101T: Object Oriented Design and Programming",
      },
    ],
  },
  {
    id: 3,
    name: "Semester III",
    subjects: [
      {
        code: "21CSS201T",
        name: "Computer Organization and Architecture",
        title: "21CSS201T: Computer Organization and Architecture",
      },
      {
        code: "21CSC201J",
        name: "Data Structures and Algorithms",
        title: "21CSC201J: Data Structures and Algorithms",
      },
      {
        code: "21CSC203P",
        name: "Advanced Programming Practice",
        title: "21CSC203P: Advanced Programming Practice",
      },
      {
        code: "21CSC202J",
        name: "Operating Systems",
        title: "21CSC202J: Operating Systems",
      },
    ],
  },
  {
    id: 4,
    name: "Semester IV",
    subjects: [
      {
        code: "21MAB204T",
        name: "Probability and Queueing Theory",
        title: "21MAB204T: Probability and Queueing Theory",
      },
      {
        code: "21CSC204J",
        name: "Design and Analysis of Algorithms",
        title: "21CSC204J: Design and Analysis of Algorithms",
      },
      {
        code: "21CSC205P",
        name: "Database Management Systems",
        title: "21CSC205P: Database Management Systems",
      },
      {
        code: "21CSC206T",
        name: "Artificial Intelligence",
        title: "21CSC206T: Artificial Intelligence",
      },
    ],
  },
];

for (const sem of COURSES) for (const sub of sem.subjects) SUBJECT_CODES.push(sub.code);

export interface Catalogue {
  semesters: SemesterInfo[];
  /** Flat list of all subjects (with their semester) for search / lookups. */
  allSubjects: SubjectEntry[];
  getSubject(code: string | null | undefined): SubjectEntry | undefined;
  getSemester(id: number | null | undefined): SemesterInfo | undefined;
}

export function buildCatalogue(files: PaperFiles): Catalogue {
  const semesters: SemesterInfo[] = COURSES.map((sem) => ({
    ...sem,
    subjects: sem.subjects.map((sub) => ({ ...sub, files: files[sub.code] ?? [] })),
  }));
  const allSubjects: SubjectEntry[] = semesters.flatMap((sem) =>
    sem.subjects.map((sub) => ({ ...sub, semester: sem }))
  );
  const byCode = new Map(allSubjects.map((s) => [s.code, s]));
  return {
    semesters,
    allSubjects,
    getSubject: (code) => (code ? byCode.get(code) : undefined),
    getSemester: (id) => semesters.find((s) => s.id === id),
  };
}
