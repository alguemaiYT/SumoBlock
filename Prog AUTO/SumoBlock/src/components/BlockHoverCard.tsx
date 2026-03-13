import type { ReactNode } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { blockHoverData } from '@/lib/blockHoverData';

interface BlockHoverCardProps {
  definitionId: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function BlockHoverCard({ definitionId, children, side = 'right' }: BlockHoverCardProps) {
  const data = blockHoverData[definitionId];

  if (!data) return <>{children}</>;

  const { description, detail, truthTable } = data;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side={side}
        align="start"
        className="w-72 space-y-2 p-3 text-xs"
      >
        <p className="font-semibold text-sm text-foreground">{description}</p>
        {detail && <p className="text-muted-foreground leading-relaxed">{detail}</p>}

        {truthTable && (
          <div className="pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Tabela Verdade
            </p>
            <table className="w-full border-collapse text-center text-[11px]">
              <thead>
                <tr>
                  {truthTable.headers.map((h) => (
                    <th
                      key={h}
                      className="border border-border bg-muted/50 px-2 py-1 font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {truthTable.rows.map((row, i) => (
                  <tr key={i}>
                    {row.inputs.map((val, j) => (
                      <td
                        key={j}
                        className="border border-border px-2 py-1 font-mono text-foreground"
                      >
                        {val}
                      </td>
                    ))}
                    <td
                      className={`border border-border px-2 py-1 font-mono font-bold ${
                        row.output === '1' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {row.output}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
