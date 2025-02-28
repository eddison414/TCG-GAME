export class DialogRenderer {
  constructor() {
    this.activeDialog = null;
  }
  
  showDialog(options) {
    const {
      title = '',
      content = '',
      width = '600px',
      height = 'auto',
      buttons = [],
      onClose = null,
      className = ''
    } = options;
    
    this.closeDialog();
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';
    
    const dialogContainer = document.createElement('div');
    dialogContainer.className = `dialog-container ${className}`;
    dialogContainer.style.backgroundColor = 'white';
    dialogContainer.style.padding = '20px';
    dialogContainer.style.borderRadius = '8px';
    dialogContainer.style.maxWidth = width;
    dialogContainer.style.width = width;
    dialogContainer.style.height = height;
    dialogContainer.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5)';
    dialogContainer.style.position = 'relative';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'dialog-close-btn';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#666';
    
    closeButton.onclick = () => {
      this.closeDialog();
      if (onClose) onClose();
    };
    
    dialogContainer.appendChild(closeButton);
    
    if (title) {
      const titleElement = document.createElement('h2');
      titleElement.textContent = title;
      titleElement.style.margin = '0 0 20px 0';
      titleElement.style.paddingRight = '20px';
      dialogContainer.appendChild(titleElement);
    }
    
    if (typeof content === 'string') {
      const contentElement = document.createElement('div');
      contentElement.className = 'dialog-content';
      contentElement.innerHTML = content;
      dialogContainer.appendChild(contentElement);
    } else if (content instanceof HTMLElement) {
      content.classList.add('dialog-content');
      dialogContainer.appendChild(content);
    }
    
    if (buttons.length > 0) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'dialog-buttons';
      buttonContainer.style.marginTop = '20px';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'flex-end';
      buttonContainer.style.gap = '10px';
      
      buttons.forEach(buttonConfig => {
        const button = document.createElement('button');
        button.textContent = buttonConfig.text;
        button.className = `dialog-btn ${buttonConfig.className || ''}`;
        button.style.padding = '8px 16px';
        button.style.borderRadius = '4px';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        
        if (buttonConfig.primary) {
          button.style.backgroundColor = '#4a90e2';
          button.style.color = 'white';
        } else {
          button.style.backgroundColor = '#e0e0e0';
          button.style.color = '#333';
        }
        
        if (buttonConfig.style) {
          Object.assign(button.style, buttonConfig.style);
        }
        
        button.onclick = () => {
          if (buttonConfig.action) {
            buttonConfig.action();
          }
          
          if (buttonConfig.closeOnClick !== false) {
            this.closeDialog();
          }
        };
        
        buttonContainer.appendChild(button);
      });
      
      dialogContainer.appendChild(buttonContainer);
    }
    
    modalOverlay.appendChild(dialogContainer);
    
    document.body.appendChild(modalOverlay);
    
    this.activeDialog = modalOverlay;
    
    return dialogContainer;
  }
  
  closeDialog() {
    if (this.activeDialog && document.body.contains(this.activeDialog)) {
      document.body.removeChild(this.activeDialog);
      this.activeDialog = null;
    }
  }
  
  showPositionSelection(options) {
    const {
      card,
      positions = [0, 1, 2, 3, 4, 5],
      occupiedPositions = [],
      isEvolution = false
    } = options;
    
    return new Promise((resolve, reject) => {
      const content = document.createElement('div');
      
      const positionNote = document.createElement('p');
      positionNote.textContent = 'Creatures can only be summoned in positions 0-5. Positions 6-8 can only be reached by movement.';
      positionNote.style.color = '#1976d2';
      positionNote.style.fontStyle = 'italic';
      positionNote.style.marginBottom = '15px';
      content.appendChild(positionNote);
      
      const gridContainer = document.createElement('div');
      gridContainer.style.display = 'grid';
      gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
      gridContainer.style.gridTemplateRows = 'repeat(3, 1fr)';
      gridContainer.style.gap = '10px';
      gridContainer.style.margin = '20px auto';
      gridContainer.style.width = '300px';
      gridContainer.style.height = '300px';
      
      for (let pos = 0; pos < 9; pos++) {
        const cell = document.createElement('div');
        cell.style.border = '1px solid #ccc';
        cell.style.borderRadius = '8px';
        cell.style.display = 'flex';
        cell.style.justifyContent = 'center';
        cell.style.alignItems = 'center';
        cell.style.position = 'relative';
        
        const posLabel = document.createElement('div');
        posLabel.textContent = `Pos ${pos}`;
        posLabel.style.position = 'absolute';
        posLabel.style.top = '5px';
        posLabel.style.right = '5px';
        posLabel.style.fontSize = '10px';
        posLabel.style.color = '#666';
        cell.appendChild(posLabel);
        
        const isValidPosition = positions.includes(pos);
        const isOccupied = occupiedPositions.includes(pos);
        
        if (isValidPosition) {
          if (isOccupied) {
            cell.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            
            const occupiedLabel = document.createElement('div');
            occupiedLabel.textContent = 'Occupied';
            occupiedLabel.style.fontSize = '12px';
            occupiedLabel.style.color = '#666';
            cell.appendChild(occupiedLabel);
            
            const replaceLabel = document.createElement('div');
            replaceLabel.textContent = 'Replace';
            replaceLabel.style.color = '#f44336';
            replaceLabel.style.fontSize = '10px';
            replaceLabel.style.position = 'absolute';
            replaceLabel.style.bottom = '5px';
            replaceLabel.style.width = '100%';
            replaceLabel.style.textAlign = 'center';
            cell.appendChild(replaceLabel);
            
            cell.style.cursor = 'pointer';
            cell.onclick = () => {
              this.closeDialog();
              resolve(pos);
            };
          } else {
            cell.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            cell.style.border = '2px dashed #4caf50';
            cell.style.cursor = 'pointer';
            
            const emptyLabel = document.createElement('div');
            emptyLabel.textContent = 'Empty - Place Here';
            emptyLabel.style.fontSize = '12px';
            emptyLabel.style.color = '#4caf50';
            cell.appendChild(emptyLabel);
            
            cell.onclick = () => {
              this.closeDialog();
              resolve(pos);
            };
          }
        } else {
          cell.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          cell.style.opacity = '0.6';
          
          const invalidLabel = document.createElement('div');
          invalidLabel.textContent = 'Movement Only';
          invalidLabel.style.fontSize = '12px';
          invalidLabel.style.color = '#999';
          cell.appendChild(invalidLabel);
        }
        
        gridContainer.appendChild(cell);
      }
      
      content.appendChild(gridContainer);
      
      this.showDialog({
        title: isEvolution 
          ? `Select a position for evolved ${card.name}` 
          : `Select a position for ${card.name}`,
        content,
        width: '350px',
        buttons: [
          {
            text: 'Cancel',
            action: () => reject('Selection cancelled')
          }
        ],
        onClose: () => reject('Selection cancelled')
      });
    });
  }
  
  showTargetSelection(options) {
    const {
      attacker,
      validTargets = [],
      canAttackDirectly = false
    } = options;
    
    return new Promise((resolve, reject) => {
      const content = document.createElement('div');
      
      const attackerInfo = document.createElement('div');
      attackerInfo.style.margin = '10px 0';
      attackerInfo.style.padding = '10px';
      attackerInfo.style.backgroundColor = '#f5f5f5';
      attackerInfo.style.borderRadius = '5px';
      attackerInfo.innerHTML = `<strong>Attacker:</strong> ${attacker.name} (${attacker.cp} CP) | Range: ${attacker.attackRange} | Position: ${attacker.position}`;
      content.appendChild(attackerInfo);
      
      const targetsGrid = document.createElement('div');
      targetsGrid.style.display = 'flex';
      targetsGrid.style.flexWrap = 'wrap';
      targetsGrid.style.justifyContent = 'center';
      targetsGrid.style.gap = '10px';
      targetsGrid.style.margin = '20px 0';
      
      if (validTargets.length > 0) {
        validTargets.forEach((target, index) => {
          const targetCard = document.createElement('div');
          targetCard.className = 'target-card';
          targetCard.style.width = '120px';
          targetCard.style.height = '150px';
          targetCard.style.border = '2px solid #ccc';
          targetCard.style.borderRadius = '8px';
          targetCard.style.cursor = 'pointer';
          targetCard.style.position = 'relative';
          targetCard.style.overflow = 'hidden';
          
          const cardInfo = document.createElement('div');
          cardInfo.style.position = 'absolute';
          cardInfo.style.bottom = '0';
          cardInfo.style.left = '0';
          cardInfo.style.right = '0';
          cardInfo.style.padding = '5px';
          cardInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          cardInfo.style.color = 'white';
          cardInfo.style.fontSize = '12px';
          cardInfo.innerHTML = `
            <div>${target.name}</div>
            <div>CP: ${target.cp}</div>
            <div>Pos: ${target.position}</div>
          `;
          targetCard.appendChild(cardInfo);
          
          targetCard.onclick = () => {
            this.closeDialog();
            resolve({ target, type: 'creature', index });
          };
          
          targetCard.onmouseover = () => {
            targetCard.style.borderColor = '#f44336';
            targetCard.style.boxShadow = '0 0 10px rgba(244, 67, 54, 0.5)';
          };
          
          targetCard.onmouseout = () => {
            targetCard.style.borderColor = '#ccc';
            targetCard.style.boxShadow = '';
          };
          
          targetsGrid.appendChild(targetCard);
        });
      } else {
        const noTargetsMsg = document.createElement('div');
        noTargetsMsg.textContent = 'No valid targets in range.';
        noTargetsMsg.style.color = '#f44336';
        noTargetsMsg.style.margin = '20px 0';
        noTargetsMsg.style.fontWeight = 'bold';
        targetsGrid.appendChild(noTargetsMsg);
      }
      
      content.appendChild(targetsGrid);
      
      if (canAttackDirectly) {
        const directAttackInfo = document.createElement('div');
        directAttackInfo.style.margin = '15px 0';
        directAttackInfo.style.padding = '10px';
        directAttackInfo.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
        directAttackInfo.style.borderRadius = '5px';
        directAttackInfo.innerHTML = `<p>You can choose to attack security directly.</p>`;
        content.appendChild(directAttackInfo);
        
        const directAttackBtn = document.createElement('button');
        directAttackBtn.textContent = 'Attack Security Directly';
        directAttackBtn.className = 'dialog-btn primary';
        directAttackBtn.style.backgroundColor = '#f44336';
        directAttackBtn.style.color = 'white';
        directAttackBtn.style.border = 'none';
        directAttackBtn.style.padding = '10px 20px';
        directAttackBtn.style.borderRadius = '4px';
        directAttackBtn.style.cursor = 'pointer';
        directAttackBtn.style.margin = '10px auto';
        directAttackBtn.style.display = 'block';
        
        directAttackBtn.onclick = () => {
          this.closeDialog();
          resolve({ type: 'security' });
        };
        
        content.appendChild(directAttackBtn);
      }
      
      this.showDialog({
        title: `Select a target for ${attacker.name} to attack`,
        content,
        width: '500px',
        buttons: [
          {
            text: 'Cancel',
            action: () => reject('Attack cancelled')
          }
        ],
        onClose: () => reject('Attack cancelled')
      });
    });
  }
  
  showSpellTargetSelection(options) {
    const {
      spell,
      targets = [],
      playerName = ''
    } = options;
    
    return new Promise((resolve, reject) => {
      const content = document.createElement('div');
      
      const spellInfo = document.createElement('div');
      spellInfo.style.margin = '10px 0';
      spellInfo.style.padding = '10px';
      spellInfo.style.backgroundColor = '#f5f5f5';
      spellInfo.style.borderRadius = '5px';
      spellInfo.innerHTML = `<p>${spell.effect}</p>`;
      content.appendChild(spellInfo);
      
      const targetsGrid = document.createElement('div');
      targetsGrid.style.display = 'flex';
      targetsGrid.style.flexWrap = 'wrap';
      targetsGrid.style.justifyContent = 'center';
      targetsGrid.style.gap = '10px';
      targetsGrid.style.margin = '20px 0';
      
      if (targets.length > 0) {
        targets.forEach((target, index) => {
          const targetCard = document.createElement('div');
          targetCard.className = 'target-card';
          targetCard.style.width = '120px';
          targetCard.style.height = '150px';
          targetCard.style.border = '2px solid #ccc';
          targetCard.style.borderRadius = '8px';
          targetCard.style.cursor = 'pointer';
          targetCard.style.position = 'relative';
          targetCard.style.overflow = 'hidden';
          
          const cardInfo = document.createElement('div');
          cardInfo.style.position = 'absolute';
          cardInfo.style.bottom = '0';
          cardInfo.style.left = '0';
          cardInfo.style.right = '0';
          cardInfo.style.padding = '5px';
          cardInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          cardInfo.style.color = 'white';
          cardInfo.style.fontSize = '12px';
          cardInfo.innerHTML = `
            <div>${target.name}</div>
            <div>CP: ${target.cp}</div>
            <div>Pos: ${target.position}</div>
          `;
          targetCard.appendChild(cardInfo);
          
          targetCard.onclick = () => {
            this.closeDialog();
            resolve({ target, index });
          };
          
          const isOffensive = spell.templateId === 'fireball';
          
          targetCard.onmouseover = () => {
            targetCard.style.borderColor = isOffensive ? '#f44336' : '#4caf50';
            targetCard.style.boxShadow = isOffensive 
              ? '0 0 10px rgba(244, 67, 54, 0.5)' 
              : '0 0 10px rgba(76, 175, 80, 0.5)';
          };
          
          targetCard.onmouseout = () => {
            targetCard.style.borderColor = '#ccc';
            targetCard.style.boxShadow = '';
          };
          
          targetsGrid.appendChild(targetCard);
        });
      } else {
        const noTargetsMsg = document.createElement('div');
        noTargetsMsg.textContent = `No valid targets for ${spell.name}.`;
        noTargetsMsg.style.color = '#f44336';
        noTargetsMsg.style.margin = '20px 0';
        noTargetsMsg.style.fontWeight = 'bold';
        targetsGrid.appendChild(noTargetsMsg);
      }
      
      content.appendChild(targetsGrid);
      
      this.showDialog({
        title: `Select a target for ${spell.name}`,
        content,
        width: '500px',
        buttons: [
          {
            text: 'Cancel',
            action: () => reject('Spell cancelled')
          }
        ],
        onClose: () => reject('Spell cancelled')
      });
    });
  }
  
  showEvolutionSelection(options) {
    const {
      card,
      evolutions = [],
      playerCoins = 0
    } = options;
    
    return new Promise((resolve, reject) => {
      const content = document.createElement('div');
      
      const description = document.createElement('p');
      description.textContent = 'Evolution transforms a basic class into an advanced class with enhanced stats and abilities.';
      description.style.marginBottom = '20px';
      content.appendChild(description);
      
      const optionsContainer = document.createElement('div');
      optionsContainer.style.display = 'flex';
      optionsContainer.style.flexWrap = 'wrap';
      optionsContainer.style.justifyContent = 'center';
      optionsContainer.style.gap = '20px';
      optionsContainer.style.marginBottom = '20px';
      
      evolutions.forEach(evolution => {
        const option = document.createElement('div');
        option.className = 'evolution-option';
        option.style.width = '200px';
        option.style.border = '2px solid gold';
        option.style.borderRadius = '8px';
        option.style.padding = '10px';
        option.style.backgroundColor = '#f8f8f8';
        option.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        
        const optionName = document.createElement('h4');
        optionName.textContent = evolution.name;
        optionName.style.marginBottom = '10px';
        optionName.style.color = '#333';
        option.appendChild(optionName);
        
        const statPreview = document.createElement('div');
        statPreview.style.marginBottom = '10px';
        statPreview.style.fontSize = '12px';
        
        const stats = evolution.stats;
        statPreview.innerHTML = `
          <div>STR: ${stats.STR} | DEX: ${stats.DEX}</div>
          <div>VIT: ${stats.VIT} | INT: ${stats.INT}</div>
          <div>EXP: ${stats.EXP}</div>
        `;
        option.appendChild(statPreview);
        
        if (evolution.ability) {
          const abilityText = document.createElement('div');
          abilityText.textContent = `Ability: ${evolution.ability}`;
          abilityText.style.fontSize = '12px';
          abilityText.style.color = '#6a0dad';
          abilityText.style.marginBottom = '10px';
          option.appendChild(abilityText);
        }
        
        const evolutionCost = Math.max(0, evolution.cost - 1);
        
        const costText = document.createElement('div');
        costText.textContent = `Evolution Cost: ${evolutionCost} coins`;
        costText.style.fontSize = '12px';
        costText.style.fontWeight = 'bold';
        costText.style.color = playerCoins >= evolutionCost ? '#007700' : '#cc0000';
        option.appendChild(costText);
        
        const selectButton = document.createElement('button');
        selectButton.textContent = 'Select';
        selectButton.style.marginTop = '10px';
        selectButton.style.padding = '5px 15px';
        selectButton.style.backgroundColor = '#ffcc00';
        selectButton.style.border = 'none';
        selectButton.style.borderRadius = '4px';
        selectButton.style.cursor = playerCoins >= evolutionCost ? 'pointer' : 'not-allowed';
        selectButton.style.fontWeight = 'bold';
        selectButton.disabled = playerCoins < evolutionCost;
        selectButton.style.opacity = playerCoins >= evolutionCost ? '1' : '0.5';
        
        selectButton.onclick = () => {
          if (playerCoins >= evolutionCost) {
            this.closeDialog();
            resolve(evolution.templateId);
          }
        };
        option.appendChild(selectButton);
        
        option.onmouseover = () => {
          if (playerCoins >= evolutionCost) {
            option.style.boxShadow = '0 6px 12px rgba(255, 204, 0, 0.4)';
            option.style.transform = 'translateY(-5px)';
          }
        };
        
        option.onmouseout = () => {
          option.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          option.style.transform = 'translateY(0)';
        };
        
        optionsContainer.appendChild(option);
      });
      
      content.appendChild(optionsContainer);
      
      this.showDialog({
        title: `Select an evolution path for ${card.name}`,
        content,
        width: '600px',
        buttons: [
          {
            text: 'Cancel',
            action: () => reject('Evolution cancelled')
          }
        ],
        onClose: () => reject('Evolution cancelled')
      });
    });
  }
  
  showMovementSelection(options) {
    const {
      card,
      validPositions = [],
      movementCost = 2
    } = options;
    
    return new Promise((resolve, reject) => {
      const content = document.createElement('div');
      
      const costInfo = document.createElement('p');
      costInfo.textContent = `Movement cost: ${movementCost} coins`;
      costInfo.style.fontWeight = 'bold';
      content.appendChild(costInfo);
      
      const gridContainer = document.createElement('div');
      gridContainer.style.display = 'grid';
      gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
      gridContainer.style.gridTemplateRows = 'repeat(3, 1fr)';
      gridContainer.style.gap = '10px';
      gridContainer.style.margin = '20px auto';
      gridContainer.style.width = '300px';
      gridContainer.style.height = '300px';
      
      for (let pos = 0; pos < 9; pos++) {
        const cell = document.createElement('div');
        cell.style.border = '1px solid #ccc';
        cell.style.borderRadius = '8px';
        cell.style.display = 'flex';
        cell.style.justifyContent = 'center';
        cell.style.alignItems = 'center';
        cell.style.position = 'relative';
        
        if (pos === card.position) {
          cell.style.backgroundColor = '#f0f0f0';
          cell.style.border = '2px solid #333';
          
          const cardIndicator = document.createElement('div');
          cardIndicator.textContent = card.name;
          cardIndicator.style.fontSize = '12px';
          cardIndicator.style.fontWeight = 'bold';
          cardIndicator.style.padding = '5px';
          
          cell.appendChild(cardIndicator);
        }
        else if (validPositions.includes(pos)) {
          cell.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
          cell.style.border = '2px dashed #4caf50';
          cell.style.cursor = 'pointer';
          
          const moveLabel = document.createElement('div');
          moveLabel.textContent = 'Move here';
          moveLabel.style.fontSize = '12px';
          moveLabel.style.color = '#4caf50';
          
          cell.appendChild(moveLabel);
          
          cell.onclick = () => {
            this.closeDialog();
            resolve(pos);
          };
        } else {
          cell.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          cell.textContent = 'Invalid';
          cell.style.color = '#999';
          cell.style.fontSize = '12px';
        }
        
        const posLabel = document.createElement('div');
        posLabel.textContent = `Pos ${pos}`;
        posLabel.style.position = 'absolute';
        posLabel.style.top = '5px';
        posLabel.style.right = '5px';
        posLabel.style.fontSize = '10px';
        posLabel.style.color = '#666';
        
        cell.appendChild(posLabel);
        gridContainer.appendChild(cell);
      }
      
      content.appendChild(gridContainer);
      
      this.showDialog({
        title: `Select movement destination for ${card.name}`,
        content,
        width: '350px',
        buttons: [
          {
            text: 'Cancel',
            action: () => reject('Movement cancelled')
          }
        ],
        onClose: () => reject('Movement cancelled')
      });
    });
  }
  
  showGameOver(options) {
    const {
      winner,
      reason,
      gameManager
    } = options;
    
    return new Promise((resolve) => {
      const content = document.createElement('div');
      content.style.textAlign = 'center';
      
      const winnerText = document.createElement('h3');
      winnerText.textContent = `${winner} wins!`;
      winnerText.style.marginBottom = '10px';
      content.appendChild(winnerText);
      
      const reasonText = document.createElement('p');
      reasonText.textContent = `Reason: ${reason}`;
      reasonText.style.marginBottom = '20px';
      content.appendChild(reasonText);
      
      this.showDialog({
        title: 'Game Over',
        content,
        width: '350px',
        buttons: [
          {
            text: 'New Game',
            primary: true,
            action: () => {
              if (gameManager) {
                gameManager.initGame(
                  gameManager.players[PLAYERS.PLAYER_A],
                  gameManager.players[PLAYERS.PLAYER_B]
                );
              }
              resolve();
            }
          }
        ],
        onClose: () => resolve()
      });
    });
  }
}