import click
import json
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.table import Table
from rich.panel import Panel
from rich.box import ROUNDED
from civicshield_core.analyzer.engine import run_scan
from civicshield_core.analyzer.phishing_detector import PhishingDetector

console = Console()

@click.group()
def cli():
    """CivicShield Engine CLI"""
    pass

@click.command()
@click.option("--url", required=True, help="Target URL to scan")
def scan(url):
    console.print(Panel(f"[bold cyan]CivicShield AI Scanner[/bold cyan]\nTarget: [green]{url}[/green]", box=ROUNDED))
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Initializing...", total=100)
        
        def update_progress(stage, percent, message, stats):
            progress.update(task, completed=percent, description=f"[cyan]{message}")
        
        report = run_scan(url, progress_callback=update_progress)

    console.print(f"\n[bold green]Scan Complete![/bold green] Found [bold red]{len(report['findings'])}[/bold red] vulnerabilities.", style="bold")
    
    # 1. Output Summary Table
    severity = report.get('summary', {}).get('severity_counts', {})
    sum_table = Table(title="Risk Severity Summary", box=ROUNDED)
    sum_table.add_column("Severity", style="bold", no_wrap=True)
    sum_table.add_column("Count", style="magenta")
    
    for sev, count in severity.items():
        color = "red" if sev == "critical" else "yellow" if sev == "high" else "blue" if sev == "medium" else "green"
        sum_table.add_row(f"[{color}]{sev.upper()}[/{color}]", str(count))
        
    console.print(sum_table)

    # 2. Output Detailed Findings Table
    if report['findings']:
        console.print("\n[bold cyan]Detailed Vulnerability Report:[/bold cyan]")
        for idx, finding in enumerate(report['findings'], 1):
            vuln_type = finding.get('vuln', 'Unknown')
            risk = finding.get('risk', 'LOW').upper()
            target_url = finding.get('url', 'N/A')
            param = finding.get('param', 'N/A')
            method = finding.get('method', 'GET')
            evidence = str(finding.get('evidence', 'N/A')).strip()
            remediation = finding.get('remediation', 'No specific remediation recommended.')
            
            color = "red" if risk == "CRITICAL" else "yellow" if risk == "HIGH" else "blue" if risk == "MEDIUM" else "green"
            
            detail_table = Table(show_header=False, box=ROUNDED, show_lines=True, width=console.width)
            detail_table.add_column("Field", style="cyan", no_wrap=True, width=15)
            detail_table.add_column("Value", style="white")
            
            detail_table.add_row("Vulnerability", f"[bold]{vuln_type}[/bold]")
            detail_table.add_row("Severity (Risk)", f"[bold {color}]{risk}[/bold {color}]")
            detail_table.add_row("Target Link", f"[underline]{target_url}[/underline]")
            if param != "-":
                detail_table.add_row("Parameter", f"[magenta]{param}[/magenta] (Method: {method})")
            
            if len(evidence) > 150:
                evidence = evidence[:147] + "..."
            detail_table.add_row("Evidence/Info", evidence)
            detail_table.add_row("How to Fix", f"[bold green]{remediation}[/bold green]")
            
            console.print(f"\n[bold]Finding #{idx}:[/bold]")
            console.print(detail_table)

@click.command()
@click.option("--url", required=True, help="Target URL to check for phishing")
def phish(url):
    console.print(f"[bold cyan]Checking[/bold cyan] [green]{url}[/green] [bold cyan]for phishing indicators...[/bold cyan]")
    detector = PhishingDetector()
    result = detector.analyze(url)
    
    is_phishing = result.get('is_phishing', False)
    phish_color = "red" if is_phishing else "green"
    phish_text = "Yes" if is_phishing else "No"
    
    console.print(Panel(f"[bold]Threat Score:[/bold] {result.get('threat_score', 0)}\n[bold]Confidence:[/bold] {result.get('confidence', 0)}\n[bold]Is Phishing:[/bold] [{phish_color}]{phish_text}[/{phish_color}]", title="Phishing Analysis Result", box=ROUNDED, expand=False))

cli.add_command(scan)
cli.add_command(phish)

if __name__ == "__main__":
    cli()
