import { useEffect, useState, useRef } from 'react';
import { BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { createChart, ColorType } from 'lightweight-charts';
import { marketAPI } from '../api';

interface MarketDataProps {
  symbol: string;
}

export default function MarketData({ symbol }: MarketDataProps) {
  const [ticker, setTicker] = useState<any>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [showForecast, setShowForecast] = useState(true);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const forecastSeriesRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Load market data when symbol changes
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const [tickerRes, candlesRes, forecastRes] = await Promise.all([
          marketAPI.getTicker(symbol),
          marketAPI.getCandles(symbol, '1h', 100),
          marketAPI.getForecast(symbol, 6),
        ]);
        setTicker(tickerRes.data);
        setCandles(candlesRes.data.candles);
        setForecast(forecastRes.data);
      } catch (error) {
        console.error('Failed to load market data:', error);
      }
    };

    loadMarketData();
    const interval = setInterval(loadMarketData, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [symbol]);

  // Initialize chart on mount / symbol change
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Dispose previous chart if any
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        // Set X and Y axis text (tick labels) to dark gray
        textColor: '#6b7280', // dark gray
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(107, 114, 128, 0.4)', // subtle dark gray axis line
      },
      timeScale: {
        borderColor: 'rgba(107, 114, 128, 0.4)', // subtle dark gray axis line
        timeVisible: true, // Show time on X-axis
        secondsVisible: false, // Don't show seconds
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#4ade80',
      downColor: '#f87171',
      borderVisible: false,
      wickUpColor: '#4ade80',
      wickDownColor: '#f87171',
    });

    // Add forecast line series (earth tone blue, dashed)
    const forecastLine = chart.addLineSeries({
      color: '#4A90E2',
      lineWidth: 2,
      lineStyle: 2, // Dashed line
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'Forecast',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    forecastSeriesRef.current = forecastLine;

    // Subscribe to crosshair move to show tooltip with time
    chart.subscribeCrosshairMove((param) => {
      if (!tooltipRef.current || !param.time) {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
        setTooltipData(null);
        return;
      }

      const data = param.seriesData.get(candlestickSeries) as any;
      if (!data) {
        tooltipRef.current.style.display = 'none';
        setTooltipData(null);
        return;
      }

      // Format timestamp to readable date and time
      const timestamp = param.time as number;
      const date = new Date(timestamp * 1000);
      const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Update tooltip content
      setTooltipData({
        date: dateStr,
        time: timeStr,
        open: data.open?.toFixed(2),
        high: data.high?.toFixed(2),
        low: data.low?.toFixed(2),
        close: data.close?.toFixed(2),
      });

      // Position tooltip
      const coordinate = candlestickSeries.priceToCoordinate(data.close);
      if (coordinate !== null && tooltipRef.current) {
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.left = param.point?.x + 'px';
        tooltipRef.current.style.top = '10px';
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch {}
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [symbol]);

  // Update series data when candles change
  useEffect(() => {
    if (!seriesRef.current) return;
    const formattedCandles = candles.map(c => ({
      time: c.timestamp / 1000,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    try {
      seriesRef.current.setData(formattedCandles);
      chartRef.current?.timeScale().fitContent();
    } catch (e) {
      // Ignore updates if chart was disposed between renders
      console.warn('Chart update skipped:', e);
    }
  }, [candles]);

  // Update forecast line when forecast data changes
  useEffect(() => {
    if (!forecastSeriesRef.current || !forecast || !showForecast) {
      // Hide forecast line if disabled
      if (forecastSeriesRef.current && !showForecast) {
        try {
          forecastSeriesRef.current.setData([]);
        } catch (e) {
          console.warn('Forecast clear skipped:', e);
        }
      }
      return;
    }

    try {
      // Get current price from last candle
      const lastCandle = candles[candles.length - 1];
      if (!lastCandle || !forecast.forecast) return;

      const currentTime = lastCandle.timestamp / 1000;
      const currentPrice = lastCandle.close;

      // Build forecast line data: start from current price, extend to predictions
      const forecastData = [
        { time: currentTime, value: currentPrice },
        ...forecast.forecast.map((f: any) => ({
          time: f.timestamp / 1000,
          value: f.predicted_price,
        })),
      ];

      forecastSeriesRef.current.setData(forecastData);
    } catch (e) {
      console.warn('Forecast update skipped:', e);
    }
  }, [forecast, candles, showForecast]);

  // Removed renderChart; chart lifecycle handled in effects above

  return (
    <div className="section-card">
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 />
          Market Data & Candlestick Chart
        </div>
        
        {/* Forecast controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowForecast(!showForecast)}
            style={{
              padding: '8px 16px',
              background: showForecast ? '#4A90E2' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <TrendingUp size={16} />
            {showForecast ? 'Hide Forecast' : 'Show Forecast'}
          </button>
          
          <button
            onClick={async () => {
              try {
                const forecastRes = await marketAPI.getForecast(symbol, 6);
                setForecast(forecastRes.data);
              } catch (error) {
                console.error('Failed to refresh forecast:', error);
              }
            }}
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
            title="Refresh forecast"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {ticker && (
        <div className="grid grid-3" style={{ marginBottom: '20px' }}>
          <div style={{
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Last Price</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${ticker.last?.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>24h Change</div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: ticker.change_24h >= 0 ? '#4ade80' : '#f87171',
            }}>
              {ticker.change_24h >= 0 ? '+' : ''}{ticker.change_24h?.toFixed(2)}%
            </div>
          </div>

          <div style={{
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>24h Volume</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {ticker.volume?.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <div ref={chartContainerRef} className="chart-container" />
        
        {/* Tooltip overlay */}
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            display: 'none',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.85rem',
            pointerEvents: 'none',
            zIndex: 1000,
            minWidth: '180px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          {tooltipData && (
            <>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              }}>
                <div style={{ fontSize: '0.95rem' }}>{tooltipData.date}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '2px' }}>
                  {tooltipData.time}
                </div>
              </div>
              <div style={{ display: 'grid', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Open:</span>
                  <span style={{ fontWeight: '500' }}>${tooltipData.open}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>High:</span>
                  <span style={{ fontWeight: '500', color: '#4ade80' }}>${tooltipData.high}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Low:</span>
                  <span style={{ fontWeight: '500', color: '#f87171' }}>${tooltipData.low}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Close:</span>
                  <span style={{ fontWeight: '500' }}>${tooltipData.close}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
