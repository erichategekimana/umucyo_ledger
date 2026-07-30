import os
import re

directory = '/home/eric/working_space/umucyo_ledger/frontend/src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            changes = [
                (r'totalWeight\.toFixed', r'Number(totalWeight || 0).toFixed'),
                (r'totalKg\.toFixed', r'Number(totalKg || 0).toFixed'),
                (r'row\.weight_kg\?\.toFixed', r'Number(row.weight_kg || 0).toFixed'),
                (r'row\.corrected_weight_kg\?\.toFixed', r'Number(row.corrected_weight_kg || 0).toFixed'),
                (r'\(result\.ledger_weight_kg - result\.invoice_weight_kg\)\.toFixed', r'Number(result.ledger_weight_kg - result.invoice_weight_kg || 0).toFixed'),
                (r'row\.total_weight_kg\?\.toFixed', r'Number(row.total_weight_kg || 0).toFixed'),
                (r'row\.ledger_weight_kg\?\.toFixed', r'Number(row.ledger_weight_kg || 0).toFixed'),
                (r'row\.invoice_weight_kg\?\.toFixed', r'Number(row.invoice_weight_kg || 0).toFixed'),
                (r'row\.drift_kg\?\.toFixed', r'Number(row.drift_kg || 0).toFixed'),
                (r'row\.total_amount\?\.toFixed', r'Number(row.total_amount || 0).toFixed'),
                (r'row\.amount\?\.toFixed', r'Number(row.amount || 0).toFixed'),
                (r'report\.summary\.total_revenue\.toFixed', r'Number(report.summary.total_revenue || 0).toFixed'),
                (r'report\.summary\.total_payouts\.toFixed', r'Number(report.summary.total_payouts || 0).toFixed'),
                (r'report\.summary\.pending_payouts\.toFixed', r'Number(report.summary.pending_payouts || 0).toFixed'),
                (r'row\.total_season_kg\?\.toFixed', r'Number(row.total_season_kg || 0).toFixed'),
            ]
            
            new_content = content
            for old, new in changes:
                new_content = re.sub(old, new, new_content)
                
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {file}")

