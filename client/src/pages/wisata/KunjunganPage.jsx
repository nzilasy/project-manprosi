import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { kunjunganWisataService } from '../../services/kunjunganWisataService';
import { wisataService } from '../../services/wisataService';
import {
  formatFormValidationMessage,
  getEmptyFieldIssues,
  scrollToPageTop,
} from '../../utils/formValidation';
import './KunjunganPage.css';

const CURRENT_YEAR = new Date().getFullYear();
const REPORT_YEAR_OPTIONS = [2026, 2027, 2028];
const YEAR_RECAP_YEARS = REPORT_YEAR_OPTIONS;

const TREND_RANGE_OPTIONS = [
  { value: 'year', label: 'Tahun Ini' },
];

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange() {
  const today = getStartOfToday();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    start,
    end,
    startKey: getLocalDateKey(start),
    endKey: getLocalDateKey(end),
  };
}

const INITIAL_FORM = {
  id_wisata: '',
  tanggal_mulai: getLocalDateKey(new Date()),
  tanggal_selesai: '',
  jumlah_pengunjung: '',
  catatan: '',
};

function getPayloadArray(response) {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatPercent(value) {
  return `${formatNumber(value)}%`;
}

function formatShortDate(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${value}T00:00:00`));
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'short',
  }).format(date);
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function toDateKey(date) {
  return getLocalDateKey(date);
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isDateInCurrentMonth(value) {
  if (!value) return false;

  const date = new Date(`${value}T00:00:00`);
  const { start, end } = getCurrentMonthRange();

  return date >= start && date <= end;
}

function getVisitorsByYear(reports, year) {
  return reports.reduce((total, item) => {
    if (!item.tanggal_kunjungan) return total;

    const reportYear = new Date(`${item.tanggal_kunjungan}T00:00:00`).getFullYear();

    if (reportYear !== year) return total;

    return total + (Number(item.jumlah_pengunjung) || 0);
  }, 0);
}

function buildMonthlyReportRows(reports, year) {
  const rows = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthIndex,
    monthLabel: formatMonthYear(new Date(year, monthIndex, 1)),
    totalVisitors: 0,
    reportCount: 0,
    topLocation: '-',
    reports: [],
    locationTotals: new Map(),
  }));

  reports.forEach((item) => {
    if (!item.tanggal_kunjungan) return;

    const reportDate = new Date(`${item.tanggal_kunjungan}T00:00:00`);

    if (reportDate.getFullYear() !== year) return;

    const row = rows[reportDate.getMonth()];
    const visitors = Number(item.jumlah_pengunjung) || 0;
    const locationName = getReportWisataName(item);

    row.totalVisitors += visitors;
    row.reportCount += 1;
    row.reports.push(item);
    row.locationTotals.set(locationName, (row.locationTotals.get(locationName) || 0) + visitors);
  });

  return rows.map((row) => {
    let topLocation = '-';
    let topVisitors = -1;

    row.locationTotals.forEach((visitors, locationName) => {
      if (visitors > topVisitors) {
        topLocation = locationName;
        topVisitors = visitors;
      }
    });

    return {
      ...row,
      topLocation,
      status: row.reportCount ? 'Ada data' : 'Belum ada data',
      reports: row.reports.sort(
        (a, b) => new Date(`${b.tanggal_kunjungan}T00:00:00`) - new Date(`${a.tanggal_kunjungan}T00:00:00`),
      ),
      locationTotals: undefined,
    };
  });
}

function buildTrendData(reports, range, year) {
  if (['year', '6months', '12months'].includes(range)) {
    const totalByMonth = new Map();

    reports.forEach((item) => {
      if (!item.tanggal_kunjungan) return;

      const reportDate = new Date(`${item.tanggal_kunjungan}T00:00:00`);
      const key = toMonthKey(reportDate);
      const current = totalByMonth.get(key) || 0;

      totalByMonth.set(key, current + (Number(item.jumlah_pengunjung) || 0));
    });

    const today = getStartOfToday();
    const selectedYear = Number(year) || today.getFullYear();
    const realCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const selectedCurrentMonth =
      selectedYear === today.getFullYear()
        ? realCurrentMonth
        : new Date(selectedYear, 11, 1);
    const startMonth = new Date(selectedYear, selectedCurrentMonth.getMonth(), 1);
    const endMonth = new Date(startMonth);

    if (range === 'year') {
      startMonth.setMonth(0);
      endMonth.setMonth(11);
    } else {
      startMonth.setMonth(selectedCurrentMonth.getMonth() - (range === '12months' ? 11 : 5));
    }

    const monthCount =
      (endMonth.getFullYear() - startMonth.getFullYear()) * 12
      + endMonth.getMonth()
      - startMonth.getMonth()
      + 1;

    let runningTotal = 0;
    let countedMonths = 0;
    let lineRunningTotal = 0;
    let lineMonthCount = 0;
    let previousVisitors = null;

    return Array.from({ length: monthCount }, (_, index) => {
      const date = new Date(startMonth);
      date.setMonth(startMonth.getMonth() + index);
      const key = toMonthKey(date);
      const isFuture = selectedYear === today.getFullYear() && date > realCurrentMonth;
      const monthlyVisitors = totalByMonth.get(key) || 0;
      lineRunningTotal += monthlyVisitors;
      lineMonthCount += 1;
      let trendAverage = null;
      const trendLine = Math.round(lineRunningTotal / lineMonthCount);
      let change = null;

      if (!isFuture) {
        runningTotal += monthlyVisitors;
        countedMonths += 1;
        trendAverage = Math.round(runningTotal / countedMonths);

        if (previousVisitors !== null) {
          change = monthlyVisitors - previousVisitors;
        }

        previousVisitors = monthlyVisitors;
      }

      return {
        date: `${key}-01`,
        label: formatMonthLabel(date),
        tooltipLabel: formatMonthYear(date),
        pengunjung: monthlyVisitors,
        trend: trendAverage,
        trendLine,
        change,
        isFuture,
      };
    });
  }

  const totalByDate = new Map();

  reports.forEach((item) => {
    if (!item.tanggal_kunjungan) return;

    const current = totalByDate.get(item.tanggal_kunjungan) || 0;
    totalByDate.set(
      item.tanggal_kunjungan,
      current + (Number(item.jumlah_pengunjung) || 0),
    );
  });

  const today = getStartOfToday();
  const startDate = new Date(today);

  if (range === 'month') {
    startDate.setDate(1);
  } else {
    const days = Number(range) || 30;
    startDate.setDate(startDate.getDate() - (days - 1));
  }

  const dayCount = Math.max(
    1,
    Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1,
  );

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = toDateKey(date);

    return {
      date: key,
      label: formatShortDate(key),
      tooltipLabel: formatDate(key),
      pengunjung: totalByDate.get(key) || 0,
    };
  });
}

function getTrendChartWidth(dataLength, range) {
  const pointWidth = ['year', '6months', '12months'].includes(range) ? 90 : 46;

  return Math.max(720, dataLength * pointWidth);
}

function getTrendSummary(data) {
  const visibleMonths = data.filter((item) => !item.isFuture);
  const total = visibleMonths.reduce((sum, item) => sum + item.pengunjung, 0);
  const average = visibleMonths.length ? Math.round(total / visibleMonths.length) : 0;
  const peak = visibleMonths.reduce(
    (currentPeak, item) => (item.pengunjung > currentPeak.pengunjung ? item : currentPeak),
    { label: '-', tooltipLabel: '-', pengunjung: 0 },
  );
  const latest = visibleMonths[visibleMonths.length - 1];
  const latestChange = latest?.change ?? 0;

  return {
    total,
    average,
    peakLabel: peak.tooltipLabel || peak.label,
    peakVisitors: peak.pengunjung,
    latestChange,
  };
}

function formatTrendChange(value) {
  if (!value) return 'Stabil dari bulan lalu';

  const direction = value > 0 ? 'Naik' : 'Turun';

  return `${direction} ${formatNumber(Math.abs(value))} dari bulan lalu`;
}

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  if (!item) return null;

  return (
    <div className="kunjungan-chart-tooltip">
      <strong>{item.tooltipLabel}</strong>
      <span>Pengunjung: {formatNumber(item.pengunjung)} orang</span>
      {item.trend !== null && <span>Rata-rata berjalan: {formatNumber(item.trend)} orang</span>}
      {!item.isFuture && <em>{formatTrendChange(item.change)}</em>}
      {item.isFuture && <em>Belum ada data karena bulan ini belum berjalan.</em>}
    </div>
  );
}

function getWisataName(item) {
  return item?.nama_wisata || item?.name || 'Lokasi wisata';
}

function getReportWisataName(item) {
  return getWisataName(item?.wisata) || 'Lokasi wisata';
}

function getReportPeriod(item) {
  const start = formatDate(item.tanggal_kunjungan);
  const match = String(item.catatan || '').match(/Periode sampai:\s*(\d{4}-\d{2}-\d{2})/);

  if (!match?.[1]) return start;

  return `${start} - ${formatDate(match[1])}`;
}

function ReportIcon({ name }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const icons = {
    users: (
      <svg {...commonProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  };

  return icons[name] || null;
}

export default function KunjunganPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [wisataList, setWisataList] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reportYear, setReportYear] = useState(CURRENT_YEAR);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const trendRange = 'year';
  const chartScrollRef = useRef(null);

  const trendData = useMemo(
    () => buildTrendData(reports, trendRange, reportYear),
    [reports, reportYear, trendRange],
  );
  const trendRangeLabel =
    trendRange === 'year'
      ? `Tahun ${reportYear}`
      : TREND_RANGE_OPTIONS.find((item) => item.value === trendRange)?.label || `Tahun ${reportYear}`;
  const trendChartWidth = getTrendChartWidth(trendData.length, trendRange);
  const trendSummary = useMemo(() => getTrendSummary(trendData), [trendData]);
  const trendAxisLabel = ['year', '6months', '12months'].includes(trendRange)
    ? 'bulan'
    : 'tanggal';
  const showAllReports = location.pathname.endsWith('/riwayat');
  const currentMonthRange = useMemo(() => getCurrentMonthRange(), []);
  const monthlyReportRows = useMemo(
    () => buildMonthlyReportRows(reports, reportYear),
    [reports, reportYear],
  );
  const selectedMonth = monthlyReportRows[selectedMonthIndex] || monthlyReportRows[0];
  const selectedYearTotal = monthlyReportRows.reduce(
    (total, item) => total + item.totalVisitors,
    0,
  );
  const selectedYearReportCount = monthlyReportRows.reduce(
    (total, item) => total + item.reportCount,
    0,
  );

  const yearlyRecaps = useMemo(
    () =>
      YEAR_RECAP_YEARS.map((year) => ({
        year,
        total: getVisitorsByYear(reports, year),
      })),
    [reports],
  );

  const scrollTrendChart = (direction) => {
    chartScrollRef.current?.scrollBy({
      left: direction * 320,
      behavior: 'smooth',
    });
  };

  const handleTrendChartWheel = (event) => {
    if (!chartScrollRef.current) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    event.preventDefault();
    chartScrollRef.current.scrollLeft += event.deltaY;
  };

  const handleReportYearChange = (nextYear) => {
    const year = Number(nextYear) || CURRENT_YEAR;

    setReportYear(year);
    setSelectedMonthIndex(year === CURRENT_YEAR ? new Date().getMonth() : 0);
  };

  const shiftReportYear = (direction) => {
    const currentIndex = REPORT_YEAR_OPTIONS.indexOf(reportYear);
    const nextIndex = Math.min(
      REPORT_YEAR_OPTIONS.length - 1,
      Math.max(0, currentIndex + direction),
    );

    handleReportYearChange(REPORT_YEAR_OPTIONS[nextIndex]);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [reportsResponse, wisataResponse] = await Promise.all([
        kunjunganWisataService.getAll(),
        wisataService.getAll(),
      ]);

      const nextWisata = getPayloadArray(wisataResponse);

      setReports(getPayloadArray(reportsResponse));
      setWisataList(nextWisata);

      if (!form.id_wisata && nextWisata[0]) {
        setForm((current) => ({
          ...current,
          id_wisata: String(nextWisata[0].id_wisata || nextWisata[0].id),
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat laporan pengunjung.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setMessage('');
    setError('');
    setForm((current) => ({
      ...INITIAL_FORM,
      id_wisata: current.id_wisata,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const issues = getEmptyFieldIssues([
      { key: 'id_wisata', label: 'Lokasi Wisata', value: form.id_wisata },
      { key: 'tanggal_mulai', label: 'Tanggal Mulai', value: form.tanggal_mulai },
      { key: 'tanggal_selesai', label: 'Tanggal Selesai', value: form.tanggal_selesai },
      {
        key: 'jumlah_pengunjung',
        label: 'Jumlah Pengunjung',
        value: form.jumlah_pengunjung,
        test: (value) => value === '' || value === null || Number.isNaN(Number(value)),
      },
    ]);

    if (issues.length > 0) {
      setError(formatFormValidationMessage(issues));
      scrollToPageTop();
      return;
    }

    if (
      !isDateInCurrentMonth(form.tanggal_mulai) ||
      !isDateInCurrentMonth(form.tanggal_selesai)
    ) {
      setError('Tanggal laporan hanya boleh diisi untuk bulan berjalan.');
      scrollToPageTop();
      return;
    }

    if (form.tanggal_selesai && form.tanggal_selesai < form.tanggal_mulai) {
      setError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
      scrollToPageTop();
      return;
    }

    setSubmitting(true);

    try {

      const catatan = [
        form.tanggal_selesai ? `Periode sampai: ${form.tanggal_selesai}` : '',
        form.catatan,
      ]
        .filter(Boolean)
        .join('\n');

      await kunjunganWisataService.create({
        id_wisata: Number(form.id_wisata),
        tanggal_kunjungan: form.tanggal_mulai,
        jumlah_pengunjung: Number(form.jumlah_pengunjung),
        catatan,
      });

      setMessage('Laporan pengunjung berhasil disimpan.');
      setForm((current) => ({
        ...INITIAL_FORM,
        id_wisata: current.id_wisata,
      }));
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan laporan pengunjung.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async (item) => {
    const id = item.id_kunjungan || item.id;

    if (!id) return;

    const confirmed = window.confirm(
      `Hapus laporan pengunjung ${getReportWisataName(item)} pada ${formatDate(item.tanggal_kunjungan)}?`,
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError('');
    setMessage('');

    try {
      await kunjunganWisataService.remove(id);
      setMessage('Riwayat pengunjung berhasil dihapus.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus riwayat pengunjung.');
      scrollToPageTop();
    } finally {
      setDeletingId(null);
    }
  };

  const renderMonthlyReportCard = () => (
    <article className="kunjungan-table-card kunjungan-monthly-card">
      <div className="kunjungan-card-header kunjungan-monthly-header">
        <div>
          <h2>Rekap Bulanan Pengunjung</h2>
          <p>
            {formatNumber(selectedYearTotal)} pengunjung dari{' '}
            {formatNumber(selectedYearReportCount)} laporan pada {reportYear}.
          </p>
        </div>
        <div className="kunjungan-monthly-actions">
          <button
            type="button"
            className="kunjungan-year-step"
            onClick={() => shiftReportYear(-1)}
            disabled={reportYear === REPORT_YEAR_OPTIONS[0]}
            aria-label="Tahun sebelumnya"
          >
            {'<'}
          </button>
          <select
            className="kunjungan-year-select"
            value={reportYear}
            onChange={(event) => handleReportYearChange(event.target.value)}
            aria-label="Pilih tahun rekap laporan"
          >
            {REPORT_YEAR_OPTIONS.map((year) => (
              <option value={year} key={year}>
                Tahun {year}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="kunjungan-year-step"
            onClick={() => shiftReportYear(1)}
            disabled={reportYear === REPORT_YEAR_OPTIONS[REPORT_YEAR_OPTIONS.length - 1]}
            aria-label="Tahun berikutnya"
          >
            {'>'}
          </button>
          <button
            type="button"
            className="kunjungan-monthly-nav"
            onClick={() => navigate(showAllReports ? '/wisata/laporan' : '/wisata/laporan/riwayat')}
          >
            {showAllReports ? 'Buat Laporan' : 'Riwayat Laporan'}
          </button>
        </div>
      </div>

      <div className="kunjungan-table-wrap kunjungan-monthly-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Total Pengunjung</th>
              <th>Jumlah Laporan</th>
              <th>Lokasi Teraktif</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Memuat rekap bulanan...</td>
              </tr>
            ) : (
              monthlyReportRows.map((item) => (
                <tr
                  key={`${reportYear}-${item.monthIndex}`}
                  className={item.monthIndex === selectedMonthIndex ? 'is-selected' : ''}
                  onClick={() => setSelectedMonthIndex(item.monthIndex)}
                >
                  <td>
                    <strong>{item.monthLabel}</strong>
                  </td>
                  <td>{formatNumber(item.totalVisitors)}</td>
                  <td>{formatNumber(item.reportCount)}</td>
                  <td>{item.topLocation}</td>
                  <td>
                    <span
                      className={`kunjungan-month-status ${
                        item.reportCount ? 'has-data' : ''
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAllReports && (
        <div className="kunjungan-month-detail">
          <div>
            <h3>Detail {selectedMonth?.monthLabel || reportYear}</h3>
            <p>
              {formatNumber(selectedMonth?.totalVisitors || 0)} pengunjung dari{' '}
              {formatNumber(selectedMonth?.reportCount || 0)} laporan.
            </p>
          </div>

          {selectedMonth?.reports?.length ? (
            <div className="kunjungan-month-detail-table">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Lokasi Wisata</th>
                    <th>Periode</th>
                    <th>Pengunjung</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMonth.reports.map((item) => {
                    const id = item.id_kunjungan || item.id;

                    return (
                      <tr key={id}>
                        <td>{formatDate(item.tanggal_kunjungan)}</td>
                        <td>{getReportWisataName(item)}</td>
                        <td>{getReportPeriod(item)}</td>
                        <td>{formatNumber(item.jumlah_pengunjung)}</td>
                        <td>
                          <button
                            type="button"
                            className="kunjungan-delete-report"
                            disabled={deletingId === id}
                            onClick={() => handleDeleteReport(item)}
                          >
                            {deletingId === id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="kunjungan-month-empty">
              Belum ada laporan pengunjung pada bulan ini.
            </div>
          )}
        </div>
      )}
    </article>
  );

  if (showAllReports) {
    return (
      <div className="kunjungan-page kunjungan-history-page">
        <header className="kunjungan-header">
          <h1>Riwayat Laporan</h1>
          <p>Lihat dan kelola laporan jumlah pengunjung wisata</p>
        </header>

        {message && <div className="kunjungan-message success">{message}</div>}
        {error && <div className="kunjungan-message error">{error}</div>}

        <section className="kunjungan-stat-grid kunjungan-history-stats">
          {yearlyRecaps.map((item, index) => (
            <StatCard
              key={item.year}
              value={formatNumber(item.total)}
              label={`Pengunjung ${item.year}`}
              note={item.year === CURRENT_YEAR ? 'Tahun berjalan' : 'Tahun berikutnya'}
              tone={['green', 'purple', 'orange', 'blue'][index]}
            />
          ))}
        </section>

        {renderMonthlyReportCard()}
      </div>
    );
  }

  return (
    <div className="kunjungan-page">
      <header className="kunjungan-header">
        <h1>Laporan pengunjung</h1>
        <p>Laporkan jumlah pengunjung wisata pada tanggal tertentu.</p>
      </header>

      {message && <div className="kunjungan-message success">{message}</div>}

      <section className="kunjungan-stat-grid kunjungan-overview-stats">
        {yearlyRecaps.map((item, index) => (
          <StatCard
            key={item.year}
            value={formatNumber(item.total)}
            label={`Pengunjung ${item.year}`}
            note={item.year === CURRENT_YEAR ? 'Tahun berjalan' : 'Tahun berikutnya'}
            tone={['green', 'purple', 'orange', 'blue'][index]}
          />
        ))}
      </section>

      <section className="kunjungan-layout">
        <article className="kunjungan-form-card">
          <h2>Buat Laporan Pengunjung</h2>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="kunjungan-message error" role="alert">
                {error}
              </div>
            )}

            <label>
              Pilih Lokasi Wisata <strong>*</strong>
              <select
                value={form.id_wisata}
                onChange={(event) => handleChange('id_wisata', event.target.value)}
                required
              >
                <option value="">Pilih lokasi wisata</option>
                {wisataList.map((item) => {
                  const id = item.id_wisata || item.id;

                  return (
                    <option value={id} key={id}>
                      {getWisataName(item)}
                    </option>
                  );
                })}
              </select>
            </label>

            <label>
              Tanggal <strong>*</strong>
              <div className="kunjungan-date-row">
                <input
                  type="date"
                  min={currentMonthRange.startKey}
                  max={currentMonthRange.endKey}
                  value={form.tanggal_mulai}
                  onChange={(event) => handleChange('tanggal_mulai', event.target.value)}
                  required
                />
                <span>s/d</span>
                <input
                  type="date"
                  min={currentMonthRange.startKey}
                  max={currentMonthRange.endKey}
                  value={form.tanggal_selesai}
                  onChange={(event) => handleChange('tanggal_selesai', event.target.value)}
                  required
                />
              </div>
            </label>

            <label>
              Jumlah Pengunjung <strong>*</strong>
              <div className="kunjungan-input-unit">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.jumlah_pengunjung}
                  onChange={(event) => handleChange('jumlah_pengunjung', event.target.value)}
                  placeholder="Masukkan jumlah pengunjung"
                  required
                />
                <span>Orang</span>
              </div>
            </label>

            <label>
              Keterangan (Opsional)
              <textarea
                value={form.catatan}
                onChange={(event) => handleChange('catatan', event.target.value)}
                placeholder="Catatan tambahan (opsional)"
              />
            </label>

            <div className="kunjungan-form-actions">
              <button type="button" onClick={handleReset}>
                Reset
              </button>
              <button type="submit" disabled={submitting || !wisataList.length}>
                {submitting ? 'Menyimpan...' : 'Simpan Laporan'}
              </button>
            </div>
          </form>
        </article>

        <div className="kunjungan-side-stack">
          <article className="kunjungan-chart-card">
            <div className="kunjungan-card-header">
              <h2>Tren Pengunjung</h2>
              <div className="kunjungan-chart-tools">
                <span className="kunjungan-chart-range-static">{trendRangeLabel}</span>
                <button
                  type="button"
                  className="kunjungan-chart-step"
                  onClick={() => scrollTrendChart(-1)}
                  aria-label="Geser grafik ke kiri"
                >
                  {'<'}
                </button>
                <button
                  type="button"
                  className="kunjungan-chart-step"
                  onClick={() => scrollTrendChart(1)}
                  aria-label="Geser grafik ke kanan"
                >
                  {'>'}
                </button>
              </div>
            </div>

            <div className="kunjungan-trend-summary">
              <div>
                <span>Total tahun ini</span>
                <strong>{formatNumber(trendSummary.total)}</strong>
              </div>
              <div>
                <span>Bulan tertinggi</span>
                <strong>{trendSummary.peakLabel}</strong>
                <small>{formatNumber(trendSummary.peakVisitors)} orang</small>
              </div>
              <div>
                <span>Rata-rata bulanan</span>
                <strong>{formatNumber(trendSummary.average)}</strong>
              </div>
              <div>
                <span>Perubahan terakhir</span>
                <strong>{formatTrendChange(trendSummary.latestChange)}</strong>
              </div>
            </div>

            <div className="kunjungan-chart">
              {loading ? (
                <div className="kunjungan-empty-state">Memuat tren pengunjung...</div>
              ) : (
                <div
                  className="kunjungan-chart-scroll"
                  ref={chartScrollRef}
                  onWheel={handleTrendChartWheel}
                  tabIndex={0}
                >
                  <div
                    className="kunjungan-chart-canvas"
                    style={{ width: `${trendChartWidth}px` }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={trendData}
                        margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#edf1f4" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          tick={{ fill: '#8aa0bb', fontSize: 10 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#8aa0bb', fontSize: 10 }}
                          width={34}
                        />
                        <Tooltip content={<TrendTooltip />} />
                        <Bar
                          dataKey="pengunjung"
                          name="Pengunjung"
                          fill="#dfeee5"
                          radius={[7, 7, 0, 0]}
                          maxBarSize={34}
                        />
                        <Line
                          type="monotone"
                          dataKey="trendLine"
                          name="Rata-rata berjalan"
                          stroke="#5fbf70"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#ffffff', stroke: '#5fbf70', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#5fbf70', strokeWidth: 0 }}
                          connectNulls={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
            <p className="kunjungan-chart-note">
              {trendRangeLabel}. Gunakan tombol panah atau scroll di grafik untuk melihat semua{' '}
              {trendAxisLabel}.
            </p>
          </article>

          {renderMonthlyReportCard()}
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label, note, trend, tone = 'green' }) {
  const trendNumber = Number(trend);
  const hasTrend = Number.isFinite(trendNumber);
  const isPositiveTrend = trendNumber >= 0;

  return (
    <article className={`kunjungan-stat-card tone-${tone}`}>
      <span>
        <ReportIcon name="users" />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        <small>{note}</small>
      </div>
      {hasTrend && (
        <em className={isPositiveTrend ? 'is-up' : 'is-down'}>
          {isPositiveTrend ? '+' : ''}
          {formatPercent(trendNumber)}
        </em>
      )}
    </article>
  );
}
