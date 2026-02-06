function openEditModal(entryId) {
    const entry = currentValidation.entries.find(e => e.entryId === entryId);
    if (!entry) return;

    editingEntry = entryId;

    // Build form with entry data
    const formHtml = `
        <form id="editForm">
            <div class="form-group">
                <label>Team Number</label>
                <input type="number" name="teamNumber" value="${entry.teamNumber}" readonly>
            </div>
            <div class="form-group">
                <label>Match Number</label>
                <input type="number" name="matchNumber" value="${entry.matchNumber}" readonly>
            </div>
            <div class="form-group">
                <label>Timestamp</label>
                <input type="text" value="${new Date(entry.timestamp).toLocaleString()}" readonly>
            </div>
            <hr>
            <div style="background: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 12px;">
                ℹ️ You can edit any field below. All changes are logged for audit purposes.
            </div>
            <div id="editableFields"></div>
        </form>
    `;

    document.getElementById('editFormContainer').innerHTML = formHtml;
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingEntry = null;
}

async function saveEdit() {
    if (!editingEntry) return;

    const form = document.getElementById('editForm');
    const formData = new FormData(form);
    const updates = Object.fromEntries(formData);

    // Remove readonly fields
    delete updates.teamNumber;
    delete updates.matchNumber;

    try {
        const response = await fetch(`${API_URL}/audit-edit-entry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dataPath: currentDataPath,
                entryId: editingEntry,
                updates,
                editor: 'Web Audit Tool'
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('Entry updated successfully');
            closeEditModal();
            await runValidation();
        } else {
            alert('Error updating entry: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
        return;
    }

    const reason = prompt('Please provide a reason for deletion:');
    if (!reason) return;

    try {
        const response = await fetch(`${API_URL}/audit-delete-entry`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dataPath: currentDataPath,
                entryId,
                editor: 'Web Audit Tool',
                reason
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('Entry deleted successfully');
            await runValidation();
        } else {
            alert('Error deleting entry: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function viewHistory(entryId) {
    try {
        const response = await fetch(`${API_URL}/audit-history?dataPath=${currentDataPath}&entryId=${entryId}`);
        const result = await response.json();

        if (result.success) {
            const historyHtml = Object.entries(result.history).map(([id, log]) => `
                <div class="history-item">
                    <div class="history-time">${new Date(log.timestamp).toLocaleString()}</div>
                    <div class="history-change">
                        <strong>Type:</strong> ${log.changeType}<br>
                        <strong>Editor:</strong> ${log.editor}<br>
                        ${log.oldValue !== null ? `<strong>Old Value:</strong> <code>${JSON.stringify(log.oldValue)}</code><br>` : ''}
                        ${log.newValue !== null ? `<strong>New Value:</strong> <code>${JSON.stringify(log.newValue)}</code>` : ''}
                    </div>
                </div>
            `).join('');

            document.getElementById('historyContainer').innerHTML = historyHtml || '<p>No history available</p>';
            document.getElementById('historyModal').classList.add('active');
        } else {
            alert('Error loading history: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('active');
}
