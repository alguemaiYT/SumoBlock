import { useSumoSimulator } from '@/hooks/useSumoSimulator';
import { ArenaView } from '@/components/simulator/ArenaView';
import { RobotConfigurator } from '@/components/simulator/RobotConfigurator';
import { BottomView } from '@/components/simulator/BottomView';
import { StrategySelector } from '@/components/simulator/StrategySelector';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SimulatorPage() {
  const sim = useSumoSimulator();

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 h-12">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-semibold tracking-wide">⚙ Simulador Sumô</h1>
        <span className="text-[10px] text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">
          Física & Colisões
        </span>

        {/* Controls */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            onClick={sim.start}
            disabled={sim.simState.status === 'running'}
            className="gap-1"
          >
            <Play className="h-4 w-4" /> Iniciar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={sim.stop}
            disabled={sim.simState.status !== 'running'}
            className="gap-1"
          >
            <Square className="h-4 w-4" /> Parar
          </Button>
          <Button variant="outline" size="sm" onClick={sim.reset} className="gap-1">
            <RotateCcw className="h-4 w-4" /> Reiniciar
          </Button>
          <div className="mx-2 h-5 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sim.setShowBottomView(!sim.showBottomView)}
            className="gap-1"
          >
            {sim.showBottomView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {sim.showBottomView ? 'Ocultar vista inferior' : 'Vista inferior'}
          </Button>
        </div>
      </header>

      {/* Status bar */}
      <div className="flex shrink-0 items-center gap-4 px-4 py-1.5 border-b border-border bg-card/50 text-xs text-muted-foreground">
        <span>
          ⏱ {(sim.simState.elapsed / 1000).toFixed(1)}s
        </span>
        <span className="capitalize">Status: {sim.simState.status}</span>
        {sim.simState.status === 'finished' && (
          <span className="font-bold text-foreground">
            {sim.simState.winner === 'robot'
              ? '🏆 Seu robô venceu!'
              : sim.simState.winner === 'opponent'
                ? '💀 Oponente venceu!'
                : '🤝 Empate!'}
          </span>
        )}
        {/* Show selected strategies */}
        <span className="ml-auto text-[10px]">
          Robô: {sim.robotStrategyId ? sim.strategyBlocks.find(s => s.id === sim.robotStrategyId)?.name ?? 'IA' : 'IA Padrão'}
          {' · '}
          Oponente: {sim.opponentStrategyId ? sim.strategyBlocks.find(s => s.id === sim.opponentStrategyId)?.name ?? 'IA' : 'IA Padrão'}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel: Robot config + strategy */}
        <div className="w-64 shrink-0 border-r border-border bg-card/30 overflow-y-auto">
          <div className="p-3 border-b border-border">
            <StrategySelector
              strategies={sim.strategyBlocks}
              selectedId={sim.robotStrategyId}
              onSelect={sim.setRobotStrategyId}
              label="Meu Robô"
              accent="bg-blue-900/60 text-blue-300"
            />
          </div>
          <RobotConfigurator
            config={sim.robotCfg}
            onSetConfig={sim.setRobotCfg}
            onUpdateProxSensor={sim.updateRobotProxSensor}
            onUpdateLineSensor={sim.updateRobotLineSensor}
            label="Meu Robô"
            color="blue"
          />
        </div>

        {/* Center: Arena + optional bottom view */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className={`flex-1 flex items-center justify-center p-4 ${sim.showBottomView ? 'h-[60%]' : 'h-full'}`}>
            <ArenaView
              robotCfg={sim.robotCfg}
              opponentCfg={sim.opponentCfg}
              simState={sim.simState}
            />
          </div>
          {sim.showBottomView && (
            <div className="h-[40%] border-t border-border bg-card/20 flex items-center justify-center gap-8 p-4 overflow-auto">
              <BottomView config={sim.robotCfg} label="Meu Robô" color="#3b82f6" />
              <BottomView config={sim.opponentCfg} label="Oponente" color="#ef4444" />
            </div>
          )}
        </div>

        {/* Right panel: Opponent config + strategy */}
        <div className="w-64 shrink-0 border-l border-border bg-card/30 overflow-y-auto">
          <div className="p-3 border-b border-border">
            <StrategySelector
              strategies={sim.strategyBlocks}
              selectedId={sim.opponentStrategyId}
              onSelect={sim.setOpponentStrategyId}
              label="Oponente"
              accent="bg-red-900/60 text-red-300"
            />
          </div>
          <RobotConfigurator
            config={sim.opponentCfg}
            onSetConfig={sim.setOpponentCfg}
            onUpdateProxSensor={sim.updateOpponentProxSensor}
            onUpdateLineSensor={sim.updateOpponentLineSensor}
            label="Oponente"
            color="red"
          />
        </div>
      </div>
    </div>
  );
}
