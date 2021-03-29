import React, { useState, useEffect } from 'react';
import { Route } from 'react-router-dom'
import { createStage, checkCollision } from '../gameHelpers';

// Styled Components
import { StyledTetrisWrapper, StyledTetris } from './Styles/StyledTetris';

// Custom Hooks
import { useInterval } from '../hooks/useInterval'
import { usePlayer } from '../hooks/usePlayer';
import { useStage } from '../hooks/useStage';
import { useGameStatus } from '../hooks/useGameStatus';

// Components
import Stage from './Stage';
import Display from './Display';
import StartButton from './StartButton';
import NavBar from './NavBar'
import LeaderBoard from './LeaderBoard'
import Name from './Name'

const Tetris = (props) => {
    const [dropTime, setDropTime] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [scores, setScores] = useState([])
    const [userScores, setUserScores] = useState([])
    const [lastScore, setLastScore] = useState({})
    const [name, setName] = useState('')
    const [nameShow, setNameShow] = useState(false)

    const [player, updatePlayerPos, resetPlayer, playerRotate] = usePlayer();
    const [stage, setStage, rowsCleared] = useStage(player, resetPlayer);
    const [score, setScore, rows, setRows, level, setLevel] = useGameStatus(
        rowsCleared
    );

    useEffect(() => {
        fetch('https://react-tetris-backend.herokuapp.com/api/v2/scores',{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "bearer " + localStorage.getItem('userToken')
            }
        })
        .then(response => response.json())
        .then(scores => {
            // console.log(scores)
            setScores(scores.all_scores)
            setUserScores(scores.user_scores)
        })
    }, [lastScore, props.loggedinUser])

    const movePlayer = dir => {
        if (!checkCollision(player, stage, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0 });
        }
    }

    const startGame = () => {
    // Reset everything
    setStage(createStage());
    setDropTime(1000);
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setRows(0)
    setLevel(0)
    }

    const drop = () => {

        if (rows > (level + 1) * 10) {
            setLevel(prev => prev + 1);
            setDropTime(1000 / (level + 1) + 200)
        }
        if (!checkCollision(player, stage, { x: 0, y: 1 })) {
            updatePlayerPos({ x: 0, y: 1, collided: false })
        } else {
        // Game Over
            if (player.pos.y < 1) {
            setGameOver(true);
            setDropTime(null);
            // fetchLevel(level)
            fetchScore()
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    }

    const keyUp = ({ keyCode }) => {
        if (!gameOver) {
            if (keyCode === 40) {
                setDropTime(1000 / (level + 1) + 200);
            }
        }
    }

    const dropPlayer = () => {
    setDropTime(null)
    drop();
    }

    const move = ({ keyCode }) => {
    if (!gameOver) {
        if (keyCode === 37) {
            movePlayer(-1);
        } else if (keyCode === 39) {
            movePlayer(1);
        } else if (keyCode === 40) {
            dropPlayer();
        } else if (keyCode === 38) {
            playerRotate(stage, 1);
        }
    }
    }

    useInterval(() => {
        drop();
    }, dropTime)

    const fetchScore = () => {
        fetch("https://react-tetris-backend.herokuapp.com/api/v2/scores", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "bearer " + localStorage.getItem('userToken')
            },
            body: JSON.stringify({
                user_id: props.loggedinUser.id,
                points: score,
                rows: rows,
                level: level
            })
        })
        .then(response => response.json())
        .then(score => {
            setLastScore(score)
        })
    }

    const handleNameModalShow = () => setNameShow(true)
    const handleNameModalClose = () => setNameShow(false)

    const handleNameChange = e => setName(e.target.value)

    return (
        
    <StyledTetrisWrapper role="button" tabIndex="0" onKeyDown={e => move(e)} onKeyUp={keyUp}>
        <NavBar 
            name={name}
            handleNameModalShow={handleNameModalShow}
        />
        <Name nameShow={nameShow} handleNameModalClose={handleNameModalClose} setName={setName} handleNameChange={handleNameChange} name={name}/>
        <Route exact path="/leaderBoard" render={() => <LeaderBoard scores={scores}/>}/>
        
        <Route exact path="/deploy_react_tetris/" render={() => 
            <StyledTetris>
            <Stage stage={stage} />
            <aside>
                {gameOver ? (
                <Display gameOver={gameOver} text="Game Over" />
                ) : (
                <div>
                    <Display text={`Score: ${score}`} />
                    <Display text={`Rows: ${rows}`} />
                    <Display text={`Level: ${level}`} />
                </div>
                )}
                <StartButton callback={startGame} />
            </aside>
            </StyledTetris>
        }/>
    </StyledTetrisWrapper>
    );
};

export default Tetris;