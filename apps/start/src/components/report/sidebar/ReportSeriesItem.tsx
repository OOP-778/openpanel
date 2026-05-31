import { ColorSquare } from '@/components/color-square';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDispatch } from '@/redux';
import { shortId } from '@openpanel/common';
import { alphabetIds } from '@openpanel/constants';
import type {
  ICalculationOption,
  IChartEvent,
  IChartEventItem,
} from '@openpanel/validation';
import {
  CalculatorIcon,
  CheckIcon,
  DatabaseIcon,
  FilterIcon,
  type LucideIcon,
  SigmaIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { ReportSegment } from '../ReportSegment';
import { changeEvent } from '../reportSlice';
import { PropertiesCombobox } from './PropertiesCombobox';
import { FiltersList } from './filters/FiltersList';

export interface ReportSeriesItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  event: IChartEventItem | IChartEvent;
  index: number;
  showSegment: boolean;
  showAddFilter: boolean;
  isSelectManyEvents: boolean;
  renderDragHandle?: (index: number) => React.ReactNode;
}

export function ReportSeriesItem({
  event,
  index,
  showSegment,
  showAddFilter,
  isSelectManyEvents,
  renderDragHandle,
  ...props
}: ReportSeriesItemProps) {
  const dispatch = useDispatch();

  // Normalize event to have type field
  const normalizedEvent: IChartEventItem =
    'type' in event ? event : { ...event, type: 'event' as const };

  const isFormula = normalizedEvent.type === 'formula';
  const chartEvent = isFormula
    ? null
    : (normalizedEvent as IChartEventItem & { type: 'event' });

  return (
    <div {...props}>
      <div className="flex items-center gap-2 p-2 group">
        {renderDragHandle ? (
          renderDragHandle(index)
        ) : (
          <ColorSquare>
            <span className="block">{alphabetIds[index]}</span>
          </ColorSquare>
        )}
        {props.children}
      </div>

      {/* Segment and Filter buttons - only for events */}
      {chartEvent && (showSegment || showAddFilter) && (
        <div className="flex flex-wrap gap-2 p-2 pt-0">
          {showSegment && (
            <ReportSegment
              value={chartEvent.segment}
              onChange={(segment) => {
                dispatch(
                  changeEvent({
                    ...chartEvent,
                    segment,
                  }),
                );
              }}
            />
          )}
          {showAddFilter && (
            <PropertiesCombobox
              event={chartEvent}
              categories={['event', 'profile', 'group', 'cohort']}
              onSelect={(action) => {
                const isCohortAction = action.value === 'cohort';
                if (
                  isCohortAction &&
                  chartEvent.filters.some(
                    (f) =>
                      f.operator === 'inCohort' || f.operator === 'notInCohort',
                  )
                ) {
                  return;
                }
                dispatch(
                  changeEvent({
                    ...chartEvent,
                    filters: [
                      ...chartEvent.filters,
                      isCohortAction
                        ? {
                            id: shortId(),
                            name: 'cohort',
                            operator: 'inCohort',
                            value: [],
                            cohortIds: [],
                          }
                        : {
                            id: shortId(),
                            name: action.value,
                            operator: 'is',
                            value: [],
                          },
                    ],
                  }),
                );
              }}
            >
              {(setOpen) => (
                <SmallButton
                  onClick={() => setOpen((p) => !p)}
                  icon={FilterIcon}
                >
                  Add filter
                </SmallButton>
              )}
            </PropertiesCombobox>
          )}

          {showSegment && chartEvent.segment.startsWith('property_') && (
            <PropertiesCombobox
              include={chartEvent.name === 'session_end' ? ['duration'] : []}
              event={chartEvent}
              onSelect={(item) => {
                dispatch(
                  changeEvent({
                    ...chartEvent,
                    property: item.value,
                    type: 'event',
                  }),
                );
              }}
            >
              {(setOpen) => (
                <SmallButton
                  icon={DatabaseIcon}
                  onClick={() => setOpen((p) => !p)}
                >
                  {chartEvent.property
                    ? `Property: ${chartEvent.property}`
                    : 'Select property'}
                </SmallButton>
              )}
            </PropertiesCombobox>
          )}

          {showSegment && (
            <CalculationOptionDropdown
              value={chartEvent.calculationOption}
              onChange={(option) => {
                dispatch(
                  changeEvent({
                    ...chartEvent,
                    calculationOption: option,
                  }),
                );
              }}
            />
          )}
        </div>
      )}

      {/* Filters - only for events */}
      {chartEvent && !isSelectManyEvents && <FiltersList event={chartEvent} />}
    </div>
  );
}

const calculationOptionLabels: Record<
  NonNullable<ICalculationOption>,
  string
> = {
  cumulative_sum: 'Cumulative Sum',
  rolling_average_7: '7-day Rolling Avg',
  rolling_average_14: '14-day Rolling Avg',
  rolling_average_28: '28-day Rolling Avg',
};

function CalculationOptionDropdown({
  value,
  onChange,
}: {
  value: ICalculationOption;
  onChange: (option: ICalculationOption) => void;
}) {
  const rollingAverageValues = [
    'rolling_average_7',
    'rolling_average_14',
    'rolling_average_28',
  ] as const;
  const activeRolling = rollingAverageValues.find((v) => v === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-border bg-card p-1 px-2 text-sm font-medium leading-none text-left min-w-0"
        >
          <CalculatorIcon size={12} className="shrink-0" />
          <span className="truncate">
            {value ? calculationOptionLabels[value] : 'Calculation'}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Calculation Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => onChange(undefined)}
          >
            None
            {!value && (
              <CheckIcon className="ml-auto size-4" />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onChange('cumulative_sum')}
          >
            <SigmaIcon className="size-4 mr-2" />
            Cumulative Sum
            {value === 'cumulative_sum' && (
              <CheckIcon className="ml-auto size-4" />
            )}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <TrendingUpIcon className="size-4 mr-2" />
              Rolling Average
              {activeRolling && (
                <CheckIcon className="ml-auto size-4" />
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {rollingAverageValues.map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => onChange(opt)}
                >
                  {calculationOptionLabels[opt]}
                  {value === opt && (
                    <CheckIcon className="ml-auto size-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SmallButton({
  children,
  icon: Icon,
  ...props
}: {
  children: React.ReactNode;
  icon: LucideIcon;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 rounded-md border border-border bg-card p-1 px-2 text-sm font-medium leading-none text-left min-w-0"
      {...props}
    >
      <Icon size={12} className="shrink-0" />
      <span className="truncate">{children}</span>
    </button>
  );
}
