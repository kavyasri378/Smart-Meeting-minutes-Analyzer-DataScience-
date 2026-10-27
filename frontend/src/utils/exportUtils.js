import { jsPDF } from 'jspdf';

export function formatMeetingMinutesText(meeting) {
  const parts = meeting.participants || [];
  const points = meeting.discussion_points || [];
  const decisions = meeting.decisions || [];
  const items = meeting.action_items || [];
  const pending = meeting.pending_issues || [];
  const keywords = meeting.keywords || [];
  const sentiment = meeting.sentiment || {};
  const speakerContribs = meeting.speaker_analytics || [];

  const lines = [
    "========================================================================",
    `MEETING MINUTES: ${(meeting.title || 'Untitled Meeting').toUpperCase()}`,
    "========================================================================",
    `Date:         ${meeting.date || 'Not specified'}`,
    `Participants: ${parts.length > 0 ? parts.join(', ') : 'Not specified'}`,
    `Meeting Tone: ${sentiment.tone || 'Constructive & Forward-Looking'}`,
    "------------------------------------------------------------------------",
    "",
    "1. EXECUTIVE SUMMARY",
    `Method: ${meeting.summary_type || 'Extractive TF-IDF (Scikit-Learn)'}`,
    meeting.summary || 'No summary available.',
    "",
    "2. TOP TOPICS & KEYWORDS",
  ];

  if (keywords.length > 0) {
    lines.push("  " + keywords.map(k => k.keyword).join(' • '));
  } else {
    lines.push("  (No topic keywords extracted)");
  }

  lines.push("", "3. KEY DISCUSSION POINTS");
  if (points.length > 0) {
    points.forEach(pt => lines.push(`  * ${pt}`));
  } else {
    lines.push("  (No discussion points extracted)");
  }

  lines.push("", "4. DECISIONS MADE");
  if (decisions.length > 0) {
    decisions.forEach(d => lines.push(`  [CONFIRMED] ${d}`));
  } else {
    lines.push("  No explicit decisions were identified in the transcript.");
  }

  lines.push("", "5. ACTION ITEMS & COMMITMENTS");
  if (items.length > 0) {
    items.forEach((it, idx) => {
      lines.push(`  ${idx + 1}. Task:     ${it.task}`);
      lines.push(`     Assignee: ${it.assignee || 'Not specified'}`);
      lines.push(`     Deadline: ${it.due_date || 'Not specified'}`);
      lines.push(`     Status:   ${it.status || 'Pending'}`);
      lines.push("");
    });
  } else {
    lines.push("  No action items identified.");
  }

  lines.push("6. PENDING ISSUES & FOLLOW-UP");
  if (pending.length > 0) {
    pending.forEach(p => lines.push(`  * ${p}`));
  } else {
    lines.push("  (No pending issues flagged)");
  }

  if (speakerContribs.length > 0) {
    lines.push("", "7. SPEAKER PARTICIPATION BREAKDOWN");
    speakerContribs.forEach(spk => {
      lines.push(`  * ${spk.speaker}: ${spk.percentage}% speaking share (${spk.words} words, ${spk.turns} turns)`);
    });
  }

  lines.push(
    "",
    "========================================================================",
    "Generated automatically by Smart Meeting Minutes Analyzer (MinuteFlow AI)",
    "========================================================================"
  );

  return lines.join('\n');
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsvFile(filename, actionItems, meetingTitle, meetingDate) {
  const headers = ["Meeting Title", "Meeting Date", "Task Description", "Assignee", "Due Date", "Status"];
  const rows = actionItems.map(item => [
    `"${(meetingTitle || '').replace(/"/g, '""')}"`,
    `"${(meetingDate || '').replace(/"/g, '""')}"`,
    `"${(item.task || '').replace(/"/g, '""')}"`,
    `"${(item.assignee || 'Not specified').replace(/"/g, '""')}"`,
    `"${(item.due_date || 'Not specified').replace(/"/g, '""')}"`,
    `"${(item.status || 'Pending').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePdfMinutes(meeting) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 45;

  const checkPageOverflow = (neededHeight = 22) => {
    if (y + neededHeight > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 45;
    }
  };

  // Header Banner
  doc.setFillColor(124, 58, 237); // Purple #7c3aed
  doc.roundedRect(margin, y, contentWidth, 48, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("SMART MEETING MINUTES REPORT", margin + 16, y + 26);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("MinuteFlow AI • Natural Language Processing (NLP)", margin + 16, y + 40);
  y += 65;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 58, 4, 4, 'FD');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(meeting.title || "Untitled Meeting", margin + 12, y + 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${meeting.date || 'Not specified'}`, margin + 12, y + 33);
  const toneText = meeting.sentiment?.tone ? `  •  Tone: ${meeting.sentiment.tone}` : '';
  doc.text(`Attendees: ${(meeting.participants || []).join(', ') || 'Meeting Attendees'}${toneText}`, margin + 12, y + 47);
  y += 74;

  const renderSectionHeader = (title) => {
    checkPageOverflow(30);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(109, 40, 217); // Purple
    doc.text(title, margin + 8, y + 14);
    y += 28;
  };

  // 1. Executive Summary
  renderSectionHeader("1. EXECUTIVE SUMMARY");
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(meeting.summary || "No summary available.", contentWidth - 10);
  summaryLines.forEach(line => {
    checkPageOverflow(14);
    doc.text(line, margin + 4, y);
    y += 13;
  });
  y += 10;

  // 2. Topic Keywords
  const keywords = meeting.keywords || [];
  if (keywords.length > 0) {
    renderSectionHeader("2. SALIENT TOPICS & KEYWORDS");
    checkPageOverflow(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(13, 148, 136); // Teal
    const kwText = keywords.map(k => `[${k.keyword}]`).join('   ');
    const kwLines = doc.splitTextToSize(kwText, contentWidth - 12);
    kwLines.forEach(line => {
      checkPageOverflow(14);
      doc.text(line, margin + 6, y);
      y += 13;
    });
    y += 10;
  }

  // 3. Key Discussion Points
  renderSectionHeader("3. KEY DISCUSSION POINTS");
  const points = meeting.discussion_points || [];
  if (points.length === 0) {
    checkPageOverflow(14);
    doc.setFont('helvetica', 'italic');
    doc.text("No specific key discussion points extracted.", margin + 4, y);
    y += 14;
  } else {
    doc.setFont('helvetica', 'normal');
    points.forEach(pt => {
      checkPageOverflow(20);
      const splitPt = doc.splitTextToSize(`•  ${pt}`, contentWidth - 12);
      splitPt.forEach(line => {
        doc.text(line, margin + 4, y);
        y += 13;
      });
      y += 2;
    });
  }
  y += 10;

  // 4. Decisions Made
  renderSectionHeader("4. CONFIRMED DECISIONS");
  const decisions = meeting.decisions || [];
  if (decisions.length === 0) {
    checkPageOverflow(14);
    doc.setFont('helvetica', 'italic');
    doc.text("No explicit decisions were identified in the transcript.", margin + 4, y);
    y += 14;
  } else {
    doc.setFont('helvetica', 'normal');
    decisions.forEach(d => {
      checkPageOverflow(24);
      doc.setFillColor(240, 253, 250); // Teal tint
      doc.setDrawColor(45, 212, 191);
      doc.roundedRect(margin, y - 9, contentWidth, 20, 2, 2, 'FD');
      doc.setTextColor(13, 148, 136); // Teal
      doc.setFont('helvetica', 'bold');
      doc.text("[CONFIRMED]", margin + 6, y + 4);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      const decText = doc.splitTextToSize(d, contentWidth - 95);
      doc.text(decText[0], margin + 84, y + 4);
      y += 24;
    });
  }
  y += 10;

  // 5. Action Items Table
  renderSectionHeader("5. ACTION ITEMS & COMMITMENTS");
  const items = meeting.action_items || [];
  if (items.length === 0) {
    checkPageOverflow(14);
    doc.setFont('helvetica', 'italic');
    doc.text("No action items identified.", margin + 4, y);
    y += 14;
  } else {
    checkPageOverflow(24);
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, contentWidth, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text("TASK DESCRIPTION", margin + 6, y + 11);
    doc.text("ASSIGNEE", margin + 280, y + 11);
    doc.text("DEADLINE", margin + 390, y + 11);
    doc.text("STATUS", margin + 465, y + 11);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    items.forEach((it, idx) => {
      checkPageOverflow(26);
      const bg = idx % 2 === 0 ? 255 : 249;
      doc.setFillColor(bg, bg, bg);
      doc.rect(margin, y - 4, contentWidth, 18, 'F');

      const taskLines = doc.splitTextToSize(it.task, 265);
      doc.text(taskLines[0] || "", margin + 6, y + 8);
      doc.text(it.assignee || "Not specified", margin + 280, y + 8);
      doc.text(it.due_date || "Not specified", margin + 390, y + 8);
      
      if (it.status === 'Completed') {
        doc.setTextColor(22, 101, 52);
      } else if (it.status === 'In Progress') {
        doc.setTextColor(180, 83, 9);
      } else {
        doc.setTextColor(71, 85, 105);
      }
      doc.text(it.status || "Pending", margin + 465, y + 8);
      doc.setTextColor(30, 41, 59);
      y += 18;
    });
  }
  y += 12;

  // 6. Pending Issues
  const pending = meeting.pending_issues || [];
  if (pending.length > 0) {
    renderSectionHeader("6. PENDING ISSUES & FOLLOW-UP TOPICS");
    doc.setFont('helvetica', 'normal');
    pending.forEach(p => {
      checkPageOverflow(18);
      const splitP = doc.splitTextToSize(`•  ${p}`, contentWidth - 12);
      splitP.forEach(line => {
        doc.text(line, margin + 4, y);
        y += 13;
      });
    });
    y += 10;
  }

  // 7. Speaker Participation
  const speakerContribs = meeting.speaker_analytics || [];
  if (speakerContribs.length > 0) {
    renderSectionHeader("7. SPEAKER PARTICIPATION BREAKDOWN");
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    speakerContribs.forEach(spk => {
      checkPageOverflow(16);
      doc.text(`• ${spk.speaker}: ${spk.percentage}% of dialogue (${spk.words} words, ${spk.turns} conversational turns)`, margin + 6, y);
      y += 14;
    });
  }

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Smart Meeting Minutes Analyzer (MinuteFlow AI)  •  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' }
    );
  }

  const safeTitle = (meeting.title || 'minutes').toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`minutes_${safeTitle}.pdf`);
}
