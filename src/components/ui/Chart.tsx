import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
  VictoryArea,
  VictoryScatter,
} from 'victory-native';
import { COLORS, getRiskColor } from '@constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ChartDataPoint {
  day: string;
  score: number;
}

export interface ChartProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area';
  height?: number;
  width?: number;
  showDataPoints?: boolean;
  animate?: boolean;
}

export const Chart: React.FC<ChartProps> = ({
  data,
  type,
  height = 200,
  width = SCREEN_WIDTH - 64,
  showDataPoints = true,
  animate = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const chartData = data.map((item, index) => ({
    x: item.day,
    y: item.score,
    index,
  }));

  const animationConfig = animate
    ? { duration: 800, onLoad: { duration: 500 } }
    : undefined;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <VictoryBar
            data={chartData}
            style={{
              data: {
                fill: ({ datum }) => getRiskColor(datum.y),
                width: Math.min(30, (width - 60) / data.length - 8),
              },
            }}
            animate={animationConfig}
            cornerRadius={{ top: 4 }}
          />
        );

      case 'area':
        return (
          <>
            <VictoryArea
              data={chartData}
              style={{
                data: {
                  fill: COLORS.successTransparent,
                  stroke: COLORS.success,
                  strokeWidth: 2,
                },
              }}
              animate={animationConfig}
              interpolation="monotoneX"
            />
            {showDataPoints && (
              <VictoryScatter
                data={chartData}
                size={5}
                style={{
                  data: {
                    fill: ({ datum }) => getRiskColor(datum.y),
                    stroke: COLORS.background,
                    strokeWidth: 2,
                  },
                }}
                animate={animationConfig}
              />
            )}
          </>
        );

      case 'line':
      default:
        return (
          <>
            <VictoryLine
              data={chartData}
              style={{
                data: {
                  stroke: COLORS.success,
                  strokeWidth: 3,
                },
              }}
              animate={animationConfig}
              interpolation="monotoneX"
            />
            {showDataPoints && (
              <VictoryScatter
                data={chartData}
                size={6}
                style={{
                  data: {
                    fill: ({ datum }) => getRiskColor(datum.y),
                    stroke: COLORS.background,
                    strokeWidth: 2,
                  },
                }}
                animate={animationConfig}
              />
            )}
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <VictoryChart
        theme={VictoryTheme.material}
        height={height}
        width={width}
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
        domainPadding={{ x: type === 'bar' ? 20 : 10, y: 10 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: COLORS.border },
            tickLabels: {
              fill: COLORS.textSecondary,
              fontSize: 10,
              fontWeight: '500',
            },
            grid: { stroke: 'transparent' },
          }}
        />
        <VictoryAxis
          dependentAxis
          domain={[0, 100]}
          tickValues={[0, 25, 50, 75, 100]}
          style={{
            axis: { stroke: COLORS.border },
            tickLabels: {
              fill: COLORS.textSecondary,
              fontSize: 10,
              fontWeight: '500',
            },
            grid: {
              stroke: COLORS.border,
              strokeDasharray: '4, 4',
              opacity: 0.5,
            },
          }}
        />
        {renderChart()}
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default Chart;
