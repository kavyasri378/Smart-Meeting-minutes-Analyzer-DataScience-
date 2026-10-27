export const SAMPLE_TRANSCRIPTS = [
  {
    id: "software_team",
    title: "Sprint 14 Planning & Architecture Sync",
    date: "October 18, 2026",
    participants: ["Sarah Jenkins (Tech Lead)", "Alex Rivera (Backend)", "Michael Chang (Frontend)", "Elena Rostova (QA Engineer)"],
    description: "Engineering team sprint planning with explicit architecture decisions, assigned tasks, and deadlines.",
    transcript: `Sarah: Good morning team. Let's begin our Sprint 14 Planning meeting. Today we need to address backend database latency, finalize the responsive UI components, and establish our deployment deadlines.
Alex: Over the weekend I profiled the API endpoints. The queries on the meeting history table take over 450 milliseconds due to missing indexes.
Michael: On the frontend side, I finished connecting the Vite dev server with Tailwind CSS. The design system uses purple primary tones and teal accents, and the component hierarchy is ready for review.
Sarah: That's great progress Michael. Now, regarding the database performance issue, Alex proposed migrating to PostgreSQL, while Elena suggested indexing the existing SQLite database first.
Elena: Right, adding composite indexes on meeting date and user ID will reduce latency below 20 milliseconds without needing database migration.
Sarah: We have decided that we will keep SQLite and add composite indexes to resolve the latency issue.
Alex: Sounds like a solid plan. I will implement the database indexing and query optimizations by Friday.
Sarah: Perfect. Michael, what are the next frontend deliverables?
Michael: I need to build the interactive analytics charts and the PDF export module.
Sarah: Michael is to complete the PDF and CSV export functionality before next Monday.
Michael: Understood, I'll have the export workflows tested and merged before next Monday morning.
Elena: What about integration testing and automated regression suites?
Sarah: Elena will configure the Cypress end-to-end tests by Wednesday.
Elena: I will set up the test suites and pipeline by Wednesday afternoon.
Sarah: One pending issue: we still need to determine whether the server will be packaged as a single Docker container or multi-container setup. That is tabled for next meeting.
Alex: Agreed. Thanks everyone, let's have a productive sprint.`
  },
  {
    id: "college_capstone",
    title: "Senior Capstone Project Review",
    date: "October 19, 2026",
    participants: ["Prof. Aris Thorne (Advisor)", "David Kumar (Student Lead)", "Priya Patel (ML Dev)", "Marcus Vance (UI/UX)"],
    description: "Academic project review with feedback, some unassigned tasks, and deadline edge cases.",
    transcript: `Prof. Aris Thorne: Welcome David, Priya, and Marcus. Let's review the current status of your Smart Meeting Minutes Analyzer project.
David Kumar: Thank you Professor. We have integrated our TF-IDF extractive summarization engine and verified that it outperforms baseline frequency summarization on sample transcripts.
Priya Patel: The preprocessing pipeline cleans punctuation, tokenizes sentences, and handles abbreviations accurately. We are also extracting key decisions using deterministic pattern matching.
Prof. Aris Thorne: The approach is explainable and avoids black-box hallucinations. How are you evaluating accuracy?
Priya Patel: We compared the generated summaries against human reference summaries using ROUGE-1 and ROUGE-2 metrics.
Marcus Vance: I designed the user interface with React. The user can view the summary, action items table, and export formatted minutes.
Prof. Aris Thorne: We have agreed that your team will present the project at the Departmental Demo Day.
David Kumar: That is exciting news. We will make sure the live demo is completely polished.
Prof. Aris Thorne: David will submit the final project report and code documentation by Friday.
David Kumar: Yes Professor, I will upload the documentation to the academic portal by Friday.
Priya Patel: Someone needs to prepare the benchmark comparison charts.
Prof. Aris Thorne: Make sure the charts clearly illustrate the compression ratio. Due date is not specified for that sub-task yet, but do it before the final presentation.
Marcus Vance: I will refine the mobile responsiveness before tomorrow evening.
David Kumar: We also have an open question regarding cloud hosting credits for the department server, pending approval from the lab coordinator.
Prof. Aris Thorne: Good job team, keep up the disciplined work.`
  },
  {
    id: "business_planning",
    title: "Q4 Product Strategy & Budget Review",
    date: "October 20, 2026",
    participants: ["Jessica Taylor (VP Product)", "Daniel Brooks (Chief Marketing Officer)", "Robert Hayes (VP Sales)", "Chloe Bennett (Finance Lead)"],
    description: "Executive business meeting covering budget allocations, market launch decisions, and sales deliverables.",
    transcript: `Jessica Taylor: Welcome everyone to our Q4 Strategy and Resource Allocation session. We have three main items: pricing tier adjustments, marketing budget allocation, and the enterprise release date.
Daniel Brooks: On marketing, our customer acquisition cost dropped 18% last month. We recommend allocating $45,000 to search marketing and technical webinars.
Chloe Bennett: Finance evaluated the budget forecast. The cash flow supports the $45,000 marketing expenditure provided enterprise onboarding targets are met.
Jessica Taylor: We have decided that we will approve the $45,000 Q4 marketing budget allocation for paid acquisition.
Daniel Brooks: Fantastic. Daniel will launch the search advertising campaigns by Oct 31.
Robert Hayes: From the sales pipeline perspective, we have twelve enterprise clients currently evaluating our meeting minutes tool on private beta. They are requesting SOC-2 compliance certification.
Jessica Taylor: Robert will distribute the security whitepaper to enterprise prospects by Thursday.
Robert Hayes: I will share the whitepaper and client case studies by Thursday afternoon.
Chloe Bennett: Chloe will prepare the updated quarterly revenue forecast before November 10.
Jessica Taylor: Excellent. We agreed to launch the enterprise tier publicly on November 15.
Daniel Brooks: One open question remains: whether we offer a 14-day free trial or credit-card-required trial. That requires further customer testing and is postponed until next Tuesday.
Jessica Taylor: Thank you team, let's execute on these commitments.`
  }
];
